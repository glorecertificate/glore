import { randomUUID } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const email = (name: string) => `${name}-${suffix}@member.test`

describe.skipIf(!isLocalDatabase)('membership removal and admin flows', () => {
  let context: {
    client: typeof import('@/db/client')
    core: typeof import('@/actions/organizations/invite-core')
    invitations: typeof import('@/db/mutations/invitation')
    organizations: typeof import('@/db/mutations/organization')
    schema: typeof import('@/db/schema')
    organizationId: number
    otherOrganizationId: number
    ids: Record<'applicant' | 'editor' | 'joiner' | 'manager' | 'member' | 'multi' | 'plain', string>
  }

  const run = <T>(fn: (tx: Parameters<Parameters<typeof context.client.transaction>[0]>[0]) => Promise<T>) =>
    context.client.transaction(fn)

  const remove = async (userId: string, organizationId = context.organizationId) => {
    const membership = await context.client.db.query.memberships.findFirst({
      where: and(
        eq(context.schema.memberships.organizationId, organizationId),
        eq(context.schema.memberships.userId, userId)
      ),
    })
    if (!membership) throw new Error('Missing membership')
    return await run(tx =>
      context.organizations.removeMembership(tx, {
        actorId: context.ids.manager,
        membershipId: membership.id,
        organizationId,
      })
    )
  }

  const membershipOf = async (userId: string, organizationId = context.organizationId) =>
    await context.client.db.query.memberships.findFirst({
      where: and(
        eq(context.schema.memberships.organizationId, organizationId),
        eq(context.schema.memberships.userId, userId)
      ),
    })

  const createLink = async (createdById: string) =>
    await run(tx =>
      context.invitations.createInviteLink(tx, {
        createdById,
        expiryDays: 7,
        maxUses: null,
        organizationId: context.organizationId,
        requiresApproval: false,
        role: 'volunteer',
      })
    )

  const invite = async (address: string, invitedById: string) =>
    await run(tx =>
      context.invitations.createInvitation(tx, {
        email: address,
        expiryDays: 7,
        invitedById,
        organizationId: context.organizationId,
        role: 'volunteer',
      })
    )

  const legacyToken = async (userId: string, role = 'volunteer') =>
    await context.client.db.insert(context.schema.teamInvitations).values({
      email: email(`legacy-${userId.slice(0, 4)}`),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      firstName: 'Legacy',
      role,
      token: randomUUID(),
      userId,
    })

  const legacyTokensOf = async (userId: string) =>
    await context.client.db.query.teamInvitations.findMany({
      where: eq(context.schema.teamInvitations.userId, userId),
    })

  beforeAll(async () => {
    const [client, core, invitations, organizations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/actions/organizations/invite-core'),
      import('@/db/mutations/invitation'),
      import('@/db/mutations/organization'),
      import('@/db/schema'),
    ])
    const ids = {
      applicant: randomUUID(),
      editor: randomUUID(),
      joiner: randomUUID(),
      manager: randomUUID(),
      member: randomUUID(),
      multi: randomUUID(),
      plain: randomUUID(),
    }
    for (const [key, id] of Object.entries(ids)) {
      await client.db.insert(schema.users).values({
        email: email(key),
        firstName: key,
        id,
        isEditor: key === 'editor',
        name: key,
        onboardedAt: new Date().toISOString(),
      })
    }
    const organizationRows = await client.db
      .insert(schema.organizations)
      .values(
        ['main', 'other'].map(handle => ({
          approvedAt: new Date().toISOString(),
          city: 'Milan',
          email: email(`org-${handle}`),
          handle: `member-test-${handle}-${suffix}`,
          name: `Member Test ${handle}`,
        }))
      )
      .returning({ id: schema.organizations.id })
    const [main, other] = organizationRows
    if (!(main && other)) throw new Error('Failed to create the test organizations')
    await client.db.insert(schema.memberships).values([{ organizationId: main.id, role: 'admin', userId: ids.manager }])
    context = {
      client,
      core,
      ids,
      invitations,
      organizationId: main.id,
      organizations,
      otherOrganizationId: other.id,
      schema,
    }
  })

  beforeEach(async () => {
    vi.stubEnv('APP_URL', 'https://glore.localhost')
    const { client, ids, organizationId, otherOrganizationId, schema } = context
    for (const id of [organizationId, otherOrganizationId]) {
      await client.db
        .delete(schema.organizationInvitations)
        .where(eq(schema.organizationInvitations.organizationId, id))
      await client.db
        .delete(schema.organizationInviteLinks)
        .where(eq(schema.organizationInviteLinks.organizationId, id))
    }
    await client.db.delete(schema.teamInvitations).where(inArray(schema.teamInvitations.userId, Object.values(ids)))
    await client.db.delete(schema.memberships).where(
      inArray(
        schema.memberships.userId,
        Object.values(ids).filter(id => id !== ids.manager)
      )
    )
  })

  afterAll(async () => {
    const { client, ids, organizationId, otherOrganizationId, schema } = context
    for (const id of [organizationId, otherOrganizationId]) {
      await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, id))
      await client.db
        .delete(schema.organizationJoinRequests)
        .where(eq(schema.organizationJoinRequests.organizationId, id))
      await client.db.delete(schema.organizations).where(eq(schema.organizations.id, id))
    }
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
  })

  it('kills the invite links and open invitations of a removed member and leaves the others alone', async () => {
    await context.client.db
      .insert(context.schema.memberships)
      .values({ organizationId: context.organizationId, role: 'representative', userId: context.ids.member })
    const memberLink = await createLink(context.ids.member)
    const managerLink = await createLink(context.ids.manager)
    const memberInvite = await invite(email('invited-by-member'), context.ids.member)
    const managerInvite = await invite(email('invited-by-manager'), context.ids.manager)

    const { events } = await remove(context.ids.member)

    expect(events.map(({ type }) => type).toSorted()).toEqual(
      ['invitation.revoked', 'invite_link.revoked', 'member.removed'].toSorted()
    )
    expect(await membershipOf(context.ids.member)).toBeUndefined()
    await expect(
      run(tx =>
        context.invitations.joinThroughInviteLink(tx, {
          applicant: { email: email('joiner'), firstName: 'Joiner', userId: context.ids.joiner },
          expiryDays: 7,
          token: memberLink.link.token,
        })
      )
    ).rejects.toMatchObject({ code: 'LINK_REVOKED' })
    await expect(
      run(tx =>
        context.invitations.acceptInvitation(tx, {
          token: memberInvite.invitation.token,
          user: { email: email('invited-by-member'), id: context.ids.plain },
        })
      )
    ).rejects.toMatchObject({ code: 'REVOKED' })

    const outcome = await run(tx =>
      context.invitations.joinThroughInviteLink(tx, {
        applicant: { email: email('joiner'), firstName: 'Joiner', userId: context.ids.joiner },
        expiryDays: 7,
        token: managerLink.link.token,
      })
    )
    expect(outcome.kind).toBe('joined')
    await expect(
      run(tx =>
        context.invitations.acceptInvitation(tx, {
          token: managerInvite.invitation.token,
          user: { email: email('invited-by-manager'), id: context.ids.plain },
        })
      )
    ).resolves.toMatchObject({ organization: { id: context.organizationId } })
  })

  it('keeps invitations that were already accepted when their sender is removed', async () => {
    await context.client.db
      .insert(context.schema.memberships)
      .values({ organizationId: context.organizationId, role: 'representative', userId: context.ids.member })
    const { invitation } = await invite(email('plain'), context.ids.member)
    await run(tx =>
      context.invitations.acceptInvitation(tx, {
        token: invitation.token,
        user: { email: email('plain'), id: context.ids.plain },
      })
    )

    await remove(context.ids.member)

    const current = await context.client.db.query.organizationInvitations.findFirst({
      where: eq(context.schema.organizationInvitations.id, invitation.id),
    })
    expect(current?.acceptedAt).not.toBeNull()
    expect(current?.revokedAt).toBeNull()
    expect((await membershipOf(context.ids.plain))?.role).toBe('volunteer')
  })

  it('deletes unaccepted legacy tokens of a removed member with no other membership', async () => {
    await context.client.db
      .insert(context.schema.memberships)
      .values({ organizationId: context.organizationId, role: 'volunteer', userId: context.ids.member })
    await legacyToken(context.ids.member)

    await remove(context.ids.member)

    expect(await legacyTokensOf(context.ids.member)).toHaveLength(0)
  })

  it('keeps legacy tokens of a person who still belongs to another organization or the team', async () => {
    await context.client.db.insert(context.schema.memberships).values([
      { organizationId: context.organizationId, role: 'volunteer', userId: context.ids.multi },
      { organizationId: context.otherOrganizationId, role: 'volunteer', userId: context.ids.multi },
      { organizationId: context.organizationId, role: 'volunteer', userId: context.ids.editor },
    ])
    await legacyToken(context.ids.multi)
    await legacyToken(context.ids.editor, 'editor')

    await remove(context.ids.multi)
    await remove(context.ids.editor)

    expect(await legacyTokensOf(context.ids.multi)).toHaveLength(1)
    expect(await legacyTokensOf(context.ids.editor)).toHaveLength(1)
  })

  describe('approval and admin flows', () => {
    const createPendingApplication = async (registrant: string) => {
      const [organization] = await context.client.db
        .insert(context.schema.organizations)
        .values({
          city: 'Rome',
          email: email('applicant-org'),
          handle: `applicant-${randomUUID().slice(0, 8)}`,
          name: 'Applicant Org',
        })
        .returning({ id: context.schema.organizations.id })
      if (!organization) throw new Error('Failed to create the applicant organization')
      await context.client.db.insert(context.schema.organizationJoinRequests).values({
        email: registrant,
        firstName: 'Applicant',
        organizationId: organization.id,
        role: 'admin',
      })
      return organization.id
    }

    it('approves an application with an invitation and never links the existing account', async () => {
      const organizationId = await createPendingApplication(email('applicant'))

      const { event, invitation } = await run(tx =>
        context.organizations.approveOrganizationApplication(tx, {
          comment: null,
          expiryDays: 7,
          organizationId,
          reviewerId: context.ids.manager,
        })
      )

      const approved = await context.client.db.query.organizations.findFirst({
        where: eq(context.schema.organizations.id, organizationId),
      })
      expect(approved?.approvedAt).not.toBeNull()
      expect(
        await context.client.db.query.memberships.findFirst({
          where: eq(context.schema.memberships.organizationId, organizationId),
        })
      ).toBeUndefined()
      expect(invitation.role).toBe('admin')
      expect(invitation.userId).toBe(context.ids.applicant)
      expect(new URL(event.data.invitationUrl ?? '').pathname).toBe(`/invite/${invitation.token}`)
      expect(new URL(event.data.invitationUrl ?? '').searchParams.get('proof')).toBeTruthy()

      await run(tx =>
        context.invitations.acceptInvitation(tx, {
          token: invitation.token,
          user: { email: email('applicant'), id: context.ids.applicant },
        })
      )
      const membership = await context.client.db.query.memberships.findFirst({
        where: eq(context.schema.memberships.organizationId, organizationId),
      })
      expect(membership).toMatchObject({ role: 'admin', userId: context.ids.applicant })
      await context.client.db
        .delete(context.schema.activityEvents)
        .where(eq(context.schema.activityEvents.organizationId, organizationId))
      await context.client.db
        .delete(context.schema.organizationJoinRequests)
        .where(eq(context.schema.organizationJoinRequests.organizationId, organizationId))
      await context.client.db
        .delete(context.schema.organizations)
        .where(eq(context.schema.organizations.id, organizationId))
    })

    it('invites the representative of a new organization without creating a membership', async () => {
      const { invitation, organization } = await run(tx =>
        context.organizations.createOrganizationWithAdminInvitation(tx, {
          admin: { email: email('plain'), expiryDays: 7, invitedById: context.ids.manager },
          organization: {
            approvedAt: new Date().toISOString(),
            city: 'Turin',
            email: email('invited-org'),
            handle: `invited-${randomUUID().slice(0, 8)}`,
            name: 'Invited Org',
          },
        })
      )

      expect(invitation).toMatchObject({ role: 'admin', userId: context.ids.plain })
      expect(
        await context.client.db.query.memberships.findFirst({
          where: eq(context.schema.memberships.organizationId, organization.id),
        })
      ).toBeUndefined()
      await context.client.db
        .delete(context.schema.activityEvents)
        .where(eq(context.schema.activityEvents.organizationId, organization.id))
      await context.client.db
        .delete(context.schema.organizations)
        .where(eq(context.schema.organizations.id, organization.id))
    })

    it('invites an existing account as a member through the shared sender without adding a membership', async () => {
      const results = await context.core.sendInvitations({
        actorId: context.ids.manager,
        emails: [email('plain'), 'not-an-email'],
        locale: 'en',
        message: null,
        organizationId: context.organizationId,
        role: 'volunteer',
      })

      expect(results).toEqual([
        { email: email('plain'), status: 'sent' },
        { email: 'not-an-email', status: 'invalid' },
      ])
      expect(await membershipOf(context.ids.plain)).toBeUndefined()
    })
  })
})
