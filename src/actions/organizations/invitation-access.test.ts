import { randomUUID } from 'node:crypto'

import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const session = vi.hoisted(() => ({ role: 'representative' as 'admin' | 'representative', userId: '' }))

vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))
vi.mock('@/actions/organizations/helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('@/actions/organizations/helpers')>()),
  getOrganizationContext: vi.fn(() =>
    Promise.resolve({
      organization: { id: Number(process.env.TEST_ORGANIZATION_ID) },
      role: session.role,
      user: { id: session.userId },
    })
  ),
}))
vi.mock('@/actions/user', () => ({ getCurrentUser: vi.fn(), findUser: vi.fn() }))
vi.mock('@/actions/cookies', () => ({ getCookie: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const email = (name: string) => `${name}-${suffix}@access.test`

describe.skipIf(!isLocalDatabase)('invitation link access', () => {
  let context: {
    client: typeof import('@/db/client')
    core: typeof import('@/actions/organizations/invite-core')
    invitations: typeof import('@/db/mutations/invitation')
    queries: typeof import('@/actions/organizations/queries')
    schema: typeof import('@/db/schema')
    organizationId: number
    otherOrganizationId: number
    ids: Record<'owner' | 'representative' | 'second', string>
  }

  const run = <T>(fn: (tx: Parameters<Parameters<typeof context.client.transaction>[0]>[0]) => Promise<T>) =>
    context.client.transaction(fn)

  const invite = async (
    address: string,
    overrides: Partial<Parameters<typeof context.invitations.createInvitation>[1]> = {}
  ) =>
    await run(tx =>
      context.invitations.createInvitation(tx, {
        email: address,
        expiryDays: 7,
        invitedById: context.ids.owner,
        organizationId: context.organizationId,
        role: 'volunteer',
        ...overrides,
      })
    )

  const read = ({
    invitationId,
    managerRole,
    organizationId,
    userId,
  }: {
    invitationId: number
    managerRole: 'admin' | 'representative'
    organizationId?: number
    userId: string
  }) =>
    context.core.readInvitationUrl({
      invitationId,
      managerRole,
      organizationId: organizationId ?? context.organizationId,
      userId,
    })

  beforeAll(async () => {
    const [client, core, invitations, queries, schema] = await Promise.all([
      import('@/db/client'),
      import('@/actions/organizations/invite-core'),
      import('@/db/mutations/invitation'),
      import('@/actions/organizations/queries'),
      import('@/db/schema'),
    ])
    const ids = { owner: randomUUID(), representative: randomUUID(), second: randomUUID() }
    for (const [key, id] of Object.entries(ids)) {
      await client.db
        .insert(schema.users)
        .values({ email: email(key), firstName: key, id, name: key, onboardedAt: new Date().toISOString() })
    }
    const rows = await client.db
      .insert(schema.organizations)
      .values(
        ['main', 'other'].map(handle => ({
          approvedAt: new Date().toISOString(),
          city: 'Milan',
          email: email(`org-${handle}`),
          handle: `access-test-${handle}-${suffix}`,
          name: `Access Test ${handle}`,
        }))
      )
      .returning({ id: schema.organizations.id })
    const [main, other] = rows
    if (!(main && other)) throw new Error('Failed to create the test organizations')
    await client.db.insert(schema.memberships).values([
      { organizationId: main.id, role: 'admin', userId: ids.owner },
      { organizationId: main.id, role: 'representative', userId: ids.representative },
    ])
    process.env.TEST_ORGANIZATION_ID = String(main.id)
    context = {
      client,
      core,
      ids,
      invitations,
      organizationId: main.id,
      otherOrganizationId: other.id,
      queries,
      schema,
    }
  })

  beforeEach(async () => {
    vi.stubEnv('APP_URL', 'https://glore.localhost')
    const { client, organizationId, otherOrganizationId, schema } = context
    for (const id of [organizationId, otherOrganizationId]) {
      await client.db
        .delete(schema.organizationInvitations)
        .where(eq(schema.organizationInvitations.organizationId, id))
      await client.db
        .delete(schema.organizationInviteLinks)
        .where(eq(schema.organizationInviteLinks.organizationId, id))
    }
  })

  afterAll(async () => {
    const { client, ids, organizationId, otherOrganizationId, schema } = context
    for (const id of [organizationId, otherOrganizationId]) {
      await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, id))
      await client.db.delete(schema.organizations).where(eq(schema.organizations.id, id))
    }
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
    delete process.env.TEST_ORGANIZATION_ID
  })

  it('never puts a token or a link in the panel payload', async () => {
    session.role = 'representative'
    session.userId = context.ids.representative
    const { invitation, token } = await invite(email('listed'), { role: 'representative' })
    const { token: linkToken } = await run(tx =>
      context.invitations.createInviteLink(tx, {
        createdById: context.ids.owner,
        expiryDays: 7,
        maxUses: null,
        organizationId: context.organizationId,
        requiresApproval: false,
        role: 'volunteer',
      })
    )

    const { data, error } = await context.queries.getOrganizationPanel()

    expect(error).toBeNull()
    expect(data?.invitations.some(({ id }) => id === invitation.id)).toBe(true)
    const payload = JSON.stringify(data)
    expect(payload).not.toContain(token)
    expect(payload).not.toContain(linkToken)
    expect(payload).not.toContain('/invite/')
    expect(payload).not.toContain('/join/')
  })

  it('lets an owner copy the link of any pending invitation', async () => {
    const { invitation, token } = await invite(email('owner-copies'), { role: 'representative' })

    const url = await read({ invitationId: invitation.id, managerRole: 'admin', userId: context.ids.owner })

    expect(url.startsWith(`https://glore.localhost/invite/${token}`)).toBe(true)
  })

  it('refuses a representative the link of a role they cannot invite', async () => {
    const { invitation: adminInvitation } = await invite(email('admin-role'), {
      organizationId: context.otherOrganizationId,
      role: 'admin',
    })
    const { invitation: representativeInvitation } = await invite(email('rep-role'), { role: 'representative' })

    await expect(
      read({
        invitationId: adminInvitation.id,
        managerRole: 'representative',
        organizationId: context.otherOrganizationId,
        userId: context.ids.representative,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(
      read({
        invitationId: representativeInvitation.id,
        managerRole: 'representative',
        userId: context.ids.representative,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('lets a representative copy links for roles they may invite and their own invitations', async () => {
    const { invitation: volunteer, token: volunteerToken } = await invite(email('volunteer-role'), {
      role: 'volunteer',
    })
    const { invitation: own, token: ownToken } = await invite(email('own-representative'), {
      invitedById: context.ids.representative,
      role: 'representative',
    })

    await expect(
      read({ invitationId: volunteer.id, managerRole: 'representative', userId: context.ids.representative })
    ).resolves.toContain(volunteerToken)
    await expect(
      read({ invitationId: own.id, managerRole: 'representative', userId: context.ids.representative })
    ).resolves.toContain(ownToken)
  })

  it('refuses an invitation of another organization and one that is no longer pending', async () => {
    const { invitation: foreign } = await run(tx =>
      context.invitations.createInvitation(tx, {
        email: email('foreign'),
        expiryDays: 7,
        invitedById: context.ids.owner,
        organizationId: context.otherOrganizationId,
        role: 'volunteer',
      })
    )
    const { invitation: closed } = await invite(email('closed'))
    await run(tx =>
      context.invitations.revokeInvitation(tx, {
        actorId: context.ids.owner,
        invitationId: closed.id,
        organizationId: context.organizationId,
      })
    )

    await expect(
      read({ invitationId: foreign.id, managerRole: 'admin', userId: context.ids.owner })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      read({ invitationId: closed.id, managerRole: 'admin', userId: context.ids.owner })
    ).rejects.toMatchObject({ code: 'REVOKED' })
  })

  it('reports a valid proof on the preview only for the emailed link', async () => {
    const previews = await import('@/actions/organizations/previews')
    const { event, token } = await invite(email('preview'))
    const proof = new URL(event.data.url).searchParams.get('proof') ?? ''

    expect((await previews.getInvitationPreview(token))?.proofValid).toBe(false)
    expect((await previews.getInvitationPreview(token, 'not-the-proof'))?.proofValid).toBe(false)
    expect((await previews.getInvitationPreview(token, proof))?.proofValid).toBe(true)
  })

  it('serves the link of an invite link only while it is active and in the organization', async () => {
    const create = (organizationId: number) =>
      run(tx =>
        context.invitations.createInviteLink(tx, {
          createdById: context.ids.owner,
          expiryDays: 7,
          maxUses: null,
          organizationId,
          requiresApproval: false,
          role: 'volunteer',
        })
      )
    const { link, token } = await create(context.organizationId)
    const { link: foreign } = await create(context.otherOrganizationId)

    await expect(
      context.core.readInviteLinkUrl({ inviteLinkId: link.id, organizationId: context.organizationId })
    ).resolves.toBe(`https://glore.localhost/join/${token}`)
    await expect(
      context.core.readInviteLinkUrl({ inviteLinkId: foreign.id, organizationId: context.organizationId })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await run(tx =>
      context.invitations.revokeInviteLink(tx, {
        actorId: context.ids.owner,
        inviteLinkId: link.id,
        organizationId: context.organizationId,
      })
    )
    await expect(
      context.core.readInviteLinkUrl({ inviteLinkId: link.id, organizationId: context.organizationId })
    ).rejects.toMatchObject({ code: 'LINK_REVOKED' })
  })
})
