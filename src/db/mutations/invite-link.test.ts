import { randomUUID } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { hashToken, openToken } from '@/lib/secret-token'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const email = (name: string) => `${name}-${suffix}@link.test`

describe.skipIf(!isLocalDatabase)('invite links and join requests', () => {
  let context: {
    client: typeof import('@/db/client')
    invitations: typeof import('@/db/mutations/invitation')
    schema: typeof import('@/db/schema')
    organizationId: number
    ids: Record<'existing' | 'manager' | 'member' | 'second', string>
  }

  const run = <T>(fn: (tx: Parameters<Parameters<typeof context.client.transaction>[0]>[0]) => Promise<T>) =>
    context.client.transaction(fn)

  const createLink = async (overrides: Partial<Parameters<typeof context.invitations.createInviteLink>[1]> = {}) =>
    await run(tx =>
      context.invitations.createInviteLink(tx, {
        createdById: context.ids.manager,
        expiryDays: 7,
        maxUses: null,
        organizationId: context.organizationId,
        requiresApproval: false,
        role: 'volunteer',
        ...overrides,
      })
    )

  const join = async (
    token: string,
    applicant: Partial<Parameters<typeof context.invitations.joinThroughInviteLink>[1]['applicant']> & {
      email: string
    }
  ) =>
    await run(tx =>
      context.invitations.joinThroughInviteLink(tx, {
        applicant: { firstName: 'Test', ...applicant },
        expiryDays: 7,
        token,
      })
    )

  const membershipOf = async (userId: string) =>
    await context.client.db.query.memberships.findFirst({
      where: and(
        eq(context.schema.memberships.organizationId, context.organizationId),
        eq(context.schema.memberships.userId, userId)
      ),
    })

  const requestsFor = async (address: string) =>
    await context.client.db.query.organizationJoinRequests.findMany({
      where: and(
        eq(context.schema.organizationJoinRequests.organizationId, context.organizationId),
        eq(context.schema.organizationJoinRequests.email, address)
      ),
    })

  const invitationsFor = async (address: string) =>
    await context.client.db.query.organizationInvitations.findMany({
      where: and(
        eq(context.schema.organizationInvitations.organizationId, context.organizationId),
        eq(context.schema.organizationInvitations.email, address)
      ),
    })

  beforeAll(async () => {
    const [client, invitations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/invitation'),
      import('@/db/schema'),
    ])
    const ids = { existing: randomUUID(), manager: randomUUID(), member: randomUUID(), second: randomUUID() }
    for (const [key, id] of Object.entries(ids)) {
      await client.db
        .insert(schema.users)
        .values({ email: email(key), firstName: key, id, name: key, onboardedAt: new Date().toISOString() })
    }
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: email('org'),
        handle: `link-test-${suffix}`,
        name: 'Link Test Org',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    await client.db.insert(schema.memberships).values([
      { organizationId: organization.id, role: 'admin', userId: ids.manager },
      { organizationId: organization.id, role: 'learner', userId: ids.member },
    ])
    context = { client, ids, invitations, organizationId: organization.id, schema }
  })

  beforeEach(async () => {
    vi.stubEnv('APP_URL', 'https://glore.localhost')
    const { client, ids, organizationId, schema } = context
    await client.db
      .delete(schema.organizationJoinRequests)
      .where(eq(schema.organizationJoinRequests.organizationId, organizationId))
    await client.db
      .delete(schema.organizationInvitations)
      .where(eq(schema.organizationInvitations.organizationId, organizationId))
    await client.db
      .delete(schema.organizationInviteLinks)
      .where(eq(schema.organizationInviteLinks.organizationId, organizationId))
    await client.db.delete(schema.memberships).where(inArray(schema.memberships.userId, [ids.existing, ids.second]))
  })

  afterAll(async () => {
    const { client, ids, organizationId, schema } = context
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, organizationId))
    await client.db.delete(schema.organizations).where(eq(schema.organizations.id, organizationId))
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
  })

  it('creates a link for learners and volunteers only, with an unguessable token and an event', async () => {
    const { event, link, token } = await createLink({ maxUses: 3 })

    expect(token.length).toBeGreaterThanOrEqual(43)
    expect(link.maxUses).toBe(3)
    expect(link.uses).toBe(0)
    expect(event.type).toBe('invite_link.created')
    expect(context.invitations.inviteLinkUrl(token)).toBe(`https://glore.localhost/join/${token}`)
    await expect(createLink({ role: 'admin' })).rejects.toMatchObject({ code: 'INVALID' })
    await expect(createLink({ role: 'representative' })).rejects.toMatchObject({ code: 'INVALID' })
  })

  it('stores only the hash and a sealed copy of the token', async () => {
    const { link, token } = await createLink()

    const stored = await context.client.db.query.organizationInviteLinks.findFirst({
      where: eq(context.schema.organizationInviteLinks.id, link.id),
    })
    expect(stored?.tokenHash).toBe(hashToken(token))
    expect(stored?.tokenCipher).not.toBeNull()
    expect(stored?.tokenCipher).not.toContain(token)
    expect(openToken(stored?.tokenCipher ?? null)).toBe(token)
    expect(Object.values(stored ?? {})).not.toContain(token)
    expect(Object.values(link)).not.toContain(token)
  })

  it('returns the sealed token and rotates a legacy link whose seal is missing', async () => {
    const { link, token } = await createLink()
    const reveal = (current: { id: number; tokenCipher: string | null }) =>
      run(tx => context.invitations.revealInviteLinkToken(tx, current))

    expect(await reveal(link)).toBe(token)

    await context.client.db
      .update(context.schema.organizationInviteLinks)
      .set({ tokenCipher: null })
      .where(eq(context.schema.organizationInviteLinks.id, link.id))
    const rotated = await reveal({ id: link.id, tokenCipher: null })

    expect(rotated).not.toBe(token)
    const stored = await context.client.db.query.organizationInviteLinks.findFirst({
      where: eq(context.schema.organizationInviteLinks.id, link.id),
    })
    expect(stored?.tokenHash).toBe(hashToken(rotated))
    expect(openToken(stored?.tokenCipher ?? null)).toBe(rotated)
    await expect(join(token, { email: email('existing'), userId: context.ids.existing })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect((await join(rotated, { email: email('existing'), userId: context.ids.existing })).kind).toBe('joined')
  })

  it('adds a signed-in applicant directly when no approval is needed and counts the use', async () => {
    const { link, token } = await createLink()

    const outcome = await join(token, { email: email('existing'), userId: context.ids.existing })

    expect(outcome.kind).toBe('joined')
    expect((await membershipOf(context.ids.existing))?.role).toBe('volunteer')
    const current = await context.client.db.query.organizationInviteLinks.findFirst({
      where: eq(context.schema.organizationInviteLinks.id, link.id),
    })
    expect(current?.uses).toBe(1)
  })

  it('rejects a signed-in member and counts nothing', async () => {
    const { link, token } = await createLink()

    await expect(join(token, { email: email('member'), userId: context.ids.member })).rejects.toMatchObject({
      code: 'ALREADY_MEMBER',
    })
    const current = await context.client.db.query.organizationInviteLinks.findFirst({
      where: eq(context.schema.organizationInviteLinks.id, link.id),
    })
    expect(current?.uses).toBe(0)
  })

  it('stops accepting people once the maximum number of uses is reached', async () => {
    const { token } = await createLink({ maxUses: 1 })

    await join(token, { email: email('existing'), userId: context.ids.existing })
    await expect(join(token, { email: email('second'), userId: context.ids.second })).rejects.toMatchObject({
      code: 'LINK_EXHAUSTED',
    })
    expect(await membershipOf(context.ids.second)).toBeUndefined()
  })

  it('rejects an expired link', async () => {
    const { link, token } = await createLink()
    await context.client.db
      .update(context.schema.organizationInviteLinks)
      .set({ expiresAt: new Date(Date.now() - 60 * 1000).toISOString() })
      .where(eq(context.schema.organizationInviteLinks.id, link.id))

    await expect(join(token, { email: email('existing'), userId: context.ids.existing })).rejects.toMatchObject({
      code: 'LINK_EXPIRED',
    })
    expect(await membershipOf(context.ids.existing)).toBeUndefined()
  })

  it('stops a revoked link and refuses to revoke it twice', async () => {
    const { link, token } = await createLink()

    const { event } = await run(tx =>
      context.invitations.revokeInviteLink(tx, {
        actorId: context.ids.manager,
        inviteLinkId: link.id,
        organizationId: context.organizationId,
      })
    )

    expect(event.type).toBe('invite_link.revoked')
    await expect(join(token, { email: email('existing'), userId: context.ids.existing })).rejects.toMatchObject({
      code: 'LINK_REVOKED',
    })
    await expect(
      run(tx =>
        context.invitations.revokeInviteLink(tx, {
          actorId: context.ids.manager,
          inviteLinkId: link.id,
          organizationId: context.organizationId,
        })
      )
    ).rejects.toMatchObject({ code: 'LINK_REVOKED' })
  })

  it('keeps a signed-in applicant pending until a manager approves, then adds the membership', async () => {
    const { token } = await createLink({ requiresApproval: true })

    const outcome = await join(token, { email: email('existing'), userId: context.ids.existing })

    expect(outcome.kind).toBe('requested')
    expect(await membershipOf(context.ids.existing)).toBeUndefined()
    const [request] = await requestsFor(email('existing'))
    expect(request?.status).toBe('pending')
    expect(request?.userId).toBe(context.ids.existing)
    await expect(join(token, { email: email('existing'), userId: context.ids.existing })).rejects.toMatchObject({
      code: 'ALREADY_REQUESTED',
    })

    const approved = await run(tx =>
      context.invitations.approveJoinRequest(tx, {
        expiryDays: 7,
        organizationId: context.organizationId,
        requestId: request?.id ?? 0,
        reviewerId: context.ids.manager,
      })
    )

    expect(approved.kind).toBe('member')
    expect((await membershipOf(context.ids.existing))?.role).toBe('volunteer')
  })

  it('turns an anonymous request into an invitation and never links an account with the same email', async () => {
    const { token } = await createLink({ requiresApproval: true })

    const outcome = await join(token, { email: email('existing') })

    expect(outcome.kind).toBe('requested')
    const [request] = await requestsFor(email('existing'))
    expect(request?.userId).toBeNull()

    const approved = await run(tx =>
      context.invitations.approveJoinRequest(tx, {
        expiryDays: 7,
        organizationId: context.organizationId,
        requestId: request?.id ?? 0,
        reviewerId: context.ids.manager,
      })
    )

    expect(approved.kind).toBe('invitation')
    let invitationToken = ''
    expect(await membershipOf(context.ids.existing)).toBeUndefined()
    const [invitation] = await invitationsFor(email('existing'))
    expect(invitation?.role).toBe('volunteer')
    expect(invitation?.userId).toBe(context.ids.existing)
    if (approved.kind === 'invitation') {
      const url = new URL(approved.decidedEvent.data.url ?? '')
      invitationToken = url.pathname.replace('/invite/', '')
      expect(url.pathname).toBe(`/invite/${invitationToken}`)
      expect(hashToken(invitationToken)).toBe(invitation?.tokenHash)
      expect(url.searchParams.get('proof')).toBeTruthy()
    }

    await run(tx =>
      context.invitations.acceptInvitation(tx, {
        token: invitationToken,
        user: { email: email('existing'), id: context.ids.existing },
      })
    )
    expect((await membershipOf(context.ids.existing))?.role).toBe('volunteer')
  })

  it('sends a guest on an open link an invitation instead of a membership and hides existing members', async () => {
    const { token } = await createLink()

    const outcome = await join(token, { email: email('existing') })

    expect(outcome.kind).toBe('invited')
    expect(await membershipOf(context.ids.existing)).toBeUndefined()
    expect(await invitationsFor(email('existing'))).toHaveLength(1)

    expect((await join(token, { email: email('existing') })).kind).toBe('noop')
    expect((await join(token, { email: email('member') })).kind).toBe('noop')
    expect(await invitationsFor(email('member'))).toHaveLength(0)
  })

  it('rejects a request without creating a membership or an invitation', async () => {
    const { token } = await createLink({ requiresApproval: true })
    await join(token, { email: email('existing'), userId: context.ids.existing })
    const [request] = await requestsFor(email('existing'))

    await run(tx =>
      context.invitations.rejectJoinRequest(tx, {
        comment: 'Not now',
        organizationId: context.organizationId,
        requestId: request?.id ?? 0,
        reviewerId: context.ids.manager,
      })
    )

    expect(await membershipOf(context.ids.existing)).toBeUndefined()
    expect(await invitationsFor(email('existing'))).toHaveLength(0)
    await expect(
      run(tx =>
        context.invitations.approveJoinRequest(tx, {
          expiryDays: 7,
          organizationId: context.organizationId,
          requestId: request?.id ?? 0,
          reviewerId: context.ids.manager,
        })
      )
    ).rejects.toMatchObject({ code: 'REQUEST_DECIDED' })
  })
})
