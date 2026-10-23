import { randomUUID } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { hashToken, openToken } from '@/lib/secret-token'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const email = (name: string) => `${name}-${suffix}@invite.test`
const proofOf = (url: string) => new URL(url).searchParams.get('proof') ?? ''

describe.skipIf(!isLocalDatabase)('organization invitations', () => {
  let context: {
    client: typeof import('@/db/client')
    invitations: typeof import('@/db/mutations/invitation')
    schema: typeof import('@/db/schema')
    organizationId: number
    ids: Record<'invitee' | 'owner' | 'stranger', string>
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

  const accept = (token: string, user: { email: string; id: string }) =>
    run(tx => context.invitations.acceptInvitation(tx, { token, user }))

  const membershipOf = async (userId: string) =>
    await context.client.db.query.memberships.findFirst({
      where: and(
        eq(context.schema.memberships.organizationId, context.organizationId),
        eq(context.schema.memberships.userId, userId)
      ),
    })

  const expire = async (invitationId: number) =>
    await context.client.db
      .update(context.schema.organizationInvitations)
      .set({ expiresAt: new Date(Date.now() - 60 * 1000).toISOString() })
      .where(eq(context.schema.organizationInvitations.id, invitationId))

  const eventsFor = async (action: string) =>
    await context.client.db.query.activityEvents.findMany({
      where: and(
        eq(context.schema.activityEvents.organizationId, context.organizationId),
        eq(context.schema.activityEvents.action, action)
      ),
    })

  const user = (key: keyof typeof context.ids) => ({ email: email(key), id: context.ids[key] })

  beforeAll(async () => {
    const [client, invitations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/invitation'),
      import('@/db/schema'),
    ])
    const ids = { invitee: randomUUID(), owner: randomUUID(), stranger: randomUUID() }
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
        handle: `invite-test-${suffix}`,
        name: 'Invite Test Org',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    await client.db
      .insert(schema.memberships)
      .values({ organizationId: organization.id, role: 'admin', userId: ids.owner })
    context = { client, ids, invitations, organizationId: organization.id, schema }
  })

  beforeEach(async () => {
    vi.stubEnv('APP_URL', 'https://glore.localhost')
    const { client, ids, organizationId, schema } = context
    await client.db
      .delete(schema.organizationInvitations)
      .where(eq(schema.organizationInvitations.organizationId, organizationId))
    await client.db.delete(schema.memberships).where(inArray(schema.memberships.userId, [ids.invitee, ids.stranger]))
  })

  afterAll(async () => {
    const { client, ids, organizationId, schema } = context
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, organizationId))
    await client.db.delete(schema.organizations).where(eq(schema.organizations.id, organizationId))
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
    await client.db
      .delete(schema.users)
      .where(inArray(schema.users.email, [email('copied'), email('fresh'), email('renewed')]))
  })

  it('creates a pending invitation that expires after the configured days and records an event', async () => {
    const { event, invitation, token } = await invite(email('created'), { expiryDays: 7, message: 'Welcome' })

    expect(invitation.role).toBe('volunteer')
    expect(invitation.message).toBe('Welcome')
    const days = (Date.parse(`${invitation.expiresAt.replace(' ', 'T')}Z`) - Date.now()) / (24 * 60 * 60 * 1000)
    expect(days).toBeGreaterThan(6.9)
    expect(days).toBeLessThan(7.1)
    const url = new URL(event.data.url)
    expect(`${url.origin}${url.pathname}`).toBe(`https://glore.localhost/invite/${token}`)
    expect(proofOf(event.data.url)).not.toBe('')
    expect(await membershipOf(context.ids.stranger)).toBeUndefined()
    const events = await eventsFor('invitation.sent')
    expect(events.some(({ subjectId }) => subjectId === String(invitation.id))).toBe(true)
  })

  it('stores only the hash and a sealed copy of the token', async () => {
    const { invitation, token } = await invite(email('sealed'))

    const stored = await context.client.db.query.organizationInvitations.findFirst({
      where: eq(context.schema.organizationInvitations.id, invitation.id),
    })
    expect(token.length).toBeGreaterThanOrEqual(40)
    expect(stored?.tokenHash).toBe(hashToken(token))
    expect(stored?.tokenCipher).not.toBeNull()
    expect(stored?.tokenCipher).not.toContain(token)
    expect(openToken(stored?.tokenCipher ?? null)).toBe(token)
    expect(Object.values(stored ?? {})).not.toContain(token)
    expect(Object.values(invitation)).not.toContain(token)
  })

  it('never creates a membership when inviting an existing account', async () => {
    const { invitation } = await invite(email('invitee'))

    expect(invitation.userId).toBe(context.ids.invitee)
    expect(await membershipOf(context.ids.invitee)).toBeUndefined()
  })

  it('rejects a duplicate, a member, and a second owner', async () => {
    await invite(email('duplicate'))

    await expect(invite(email('duplicate'))).rejects.toMatchObject({ code: 'ALREADY_INVITED' })
    await expect(invite(email('owner'))).rejects.toMatchObject({ code: 'ALREADY_MEMBER' })
    await expect(invite(email('second-owner'), { role: 'admin' })).rejects.toMatchObject({ code: 'ROLE_TAKEN' })
  })

  it('refreshes an expired invitation instead of failing', async () => {
    const first = await invite(email('refresh'))
    await expire(first.invitation.id)

    const second = await invite(email('refresh'), { role: 'learner' })

    expect(second.invitation.id).toBe(first.invitation.id)
    expect(second.token).not.toBe(first.token)
    expect(second.invitation.tokenHash).toBe(hashToken(second.token))
    expect(second.invitation.tokenHash).not.toBe(first.invitation.tokenHash)
    expect(second.invitation.role).toBe('learner')
  })

  describe('accept', () => {
    it('creates the membership with the invited role and records the event', async () => {
      const { token } = await invite(email('invitee'), { role: 'tutor' })

      const result = await accept(token, user('invitee'))

      expect(result.invitation.acceptedAt).not.toBeNull()
      expect((await membershipOf(context.ids.invitee))?.role).toBe('tutor')
      const events = await eventsFor('invitation.accepted')
      expect(events.some(({ actorId }) => actorId === context.ids.invitee)).toBe(true)
    })

    it('matches the email regardless of case and rejects a second acceptance', async () => {
      const { token } = await invite(email('invitee').toUpperCase())

      await accept(token, { email: email('invitee').toUpperCase(), id: context.ids.invitee })

      await expect(accept(token, user('invitee'))).rejects.toMatchObject({ code: 'ACCEPTED' })
    })

    it('creates an account without a known password once the emailed proof is shown', async () => {
      const { event, token } = await invite(email('fresh'), { locale: 'es' })
      const proof = proofOf(event.data.url)

      const result = await run(tx =>
        context.invitations.acceptInvitationWithNewAccount(tx, { passwordHash: 'hash', proof, token })
      )

      const account = await context.client.db.query.users.findFirst({
        where: eq(context.schema.users.id, result.userId),
        with: { accounts: true },
      })
      expect(account?.emailVerified).toBe(true)
      expect(account?.onboardedAt).toBeNull()
      expect(account?.locale).toBe('es')
      expect(account?.accounts[0]?.providerId).toBe('credential')
      expect((await membershipOf(result.userId))?.role).toBe('volunteer')
      await expect(
        run(tx =>
          context.invitations.acceptInvitationWithNewAccount(tx, {
            passwordHash: 'hash',
            proof,
            token,
          })
        )
      ).rejects.toMatchObject({ code: 'ACCEPTED' })
    })

    it('refuses a copied link without the emailed proof and creates nothing', async () => {
      const { event, invitation, token } = await invite(email('copied'))
      const attempt = (proof?: string) =>
        run(tx =>
          context.invitations.acceptInvitationWithNewAccount(tx, {
            passwordHash: 'hash',
            proof,
            token,
          })
        )

      await expect(attempt()).rejects.toMatchObject({ code: 'PROOF_REQUIRED' })
      await expect(attempt('not-the-proof')).rejects.toMatchObject({ code: 'PROOF_REQUIRED' })

      expect(
        await context.client.db.query.users.findFirst({ where: eq(context.schema.users.email, email('copied')) })
      ).toBeUndefined()
      const pending = await context.client.db.query.organizationInvitations.findFirst({
        where: eq(context.schema.organizationInvitations.id, invitation.id),
      })
      expect(pending?.acceptedAt).toBeNull()
      await expect(attempt(proofOf(event.data.url))).resolves.toMatchObject({ email: email('copied') })
    })

    it('mails a fresh proof on request and retires the previous one', async () => {
      const { event, token } = await invite(email('renewed'))
      const first = proofOf(event.data.url)

      const renewed = await run(tx => context.invitations.renewInvitationProof(tx, { token }))

      const second = proofOf(renewed.url)
      expect(second).not.toBe(first)
      expect(renewed.email).toBe(email('renewed'))
      expect(new URL(renewed.url).pathname).toBe(`/invite/${token}`)
      await expect(
        run(tx =>
          context.invitations.acceptInvitationWithNewAccount(tx, {
            passwordHash: 'hash',
            proof: first,
            token,
          })
        )
      ).rejects.toMatchObject({ code: 'PROOF_REQUIRED' })
      await expect(
        run(tx =>
          context.invitations.acceptInvitationWithNewAccount(tx, {
            passwordHash: 'hash',
            proof: second,
            token,
          })
        )
      ).resolves.toMatchObject({ email: email('renewed') })
    })

    it('does not issue a proof for an address that already has an account or a closed invitation', async () => {
      const { token } = await invite(email('stranger'))
      const { invitation: closed, token: closedToken } = await invite(email('closed'))
      await run(tx =>
        context.invitations.revokeInvitation(tx, {
          actorId: context.ids.owner,
          invitationId: closed.id,
          organizationId: context.organizationId,
        })
      )

      await expect(run(tx => context.invitations.renewInvitationProof(tx, { token }))).rejects.toMatchObject({
        code: 'ACCOUNT_EXISTS',
      })
      await expect(
        run(tx => context.invitations.renewInvitationProof(tx, { token: closedToken }))
      ).rejects.toMatchObject({ code: 'REVOKED' })
    })

    it('refuses to create an account when one already exists', async () => {
      const { event, token } = await invite(email('stranger'))

      await expect(
        run(tx =>
          context.invitations.acceptInvitationWithNewAccount(tx, {
            passwordHash: 'hash',
            proof: proofOf(event.data.url),
            token,
          })
        )
      ).rejects.toMatchObject({ code: 'ACCOUNT_EXISTS' })
      expect(await membershipOf(context.ids.stranger)).toBeUndefined()
    })

    it('lets only one of two concurrent acceptances win', async () => {
      const { token } = await invite(email('stranger'))

      const results = await Promise.allSettled([accept(token, user('stranger')), accept(token, user('stranger'))])

      expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
      expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)
    })

    it('rejects an owner invitation when another owner exists by then', async () => {
      const owner = await context.client.db.query.memberships.findFirst({
        where: and(
          eq(context.schema.memberships.organizationId, context.organizationId),
          eq(context.schema.memberships.role, 'admin')
        ),
      })
      expect(owner?.userId).toBe(context.ids.owner)
      const token = randomUUID()
      await context.client.db.insert(context.schema.organizationInvitations).values({
        email: email('late-owner'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        organizationId: context.organizationId,
        role: 'admin',
        tokenHash: hashToken(token),
      })

      await expect(accept(token, { email: email('late-owner'), id: context.ids.stranger })).rejects.toMatchObject({
        code: 'ROLE_TAKEN',
      })
    })

    it.each([
      ['learner', 'tutor', 'tutor'],
      ['learner', 'representative', 'representative'],
      ['volunteer', 'tutor', 'tutor'],
      ['tutor', 'representative', 'representative'],
    ] as const)('upgrades an existing %s who accepts a %s invitation', async (current, invited, expected) => {
      const { token } = await invite(email('stranger'), { role: invited })
      await context.client.db
        .insert(context.schema.memberships)
        .values({ organizationId: context.organizationId, role: current, userId: context.ids.stranger })

      await accept(token, user('stranger'))

      expect((await membershipOf(context.ids.stranger))?.role).toBe(expected)
    })

    it.each([
      ['tutor', 'volunteer'],
      ['representative', 'tutor'],
      ['volunteer', 'volunteer'],
      ['tutor', 'tutor'],
    ] as const)('keeps the role of an existing %s who accepts a %s invitation', async (current, invited) => {
      const { token } = await invite(email('stranger'), { role: invited })
      await context.client.db
        .insert(context.schema.memberships)
        .values({ organizationId: context.organizationId, role: current, userId: context.ids.stranger })

      await accept(token, user('stranger'))

      expect((await membershipOf(context.ids.stranger))?.role).toBe(current)
    })
  })

  describe('decline', () => {
    it('marks the invitation declined without a membership and blocks a later acceptance', async () => {
      const { invitation, token } = await invite(email('invitee'))

      await run(tx => context.invitations.declineInvitation(tx, { token, user: user('invitee') }))

      expect(await membershipOf(context.ids.invitee)).toBeUndefined()
      await expect(accept(token, user('invitee'))).rejects.toMatchObject({ code: 'DECLINED' })
      const events = await eventsFor('invitation.declined')
      expect(events.some(({ subjectId }) => subjectId === String(invitation.id))).toBe(true)
    })

    it('lets the holder of the link decline without signing in but not as another account', async () => {
      const { token } = await invite(email('decline-signed-out'))

      await expect(
        run(tx => context.invitations.declineInvitation(tx, { token, user: user('stranger') }))
      ).rejects.toMatchObject({ code: 'MISMATCH' })

      const result = await run(tx => context.invitations.declineInvitation(tx, { token, user: null }))
      expect(result.invitation.declinedAt).not.toBeNull()
    })
  })

  describe('expiry', () => {
    it('blocks accepting and declining an expired invitation', async () => {
      const { invitation, token } = await invite(email('expired'))
      await expire(invitation.id)

      await expect(accept(token, user('stranger'))).rejects.toMatchObject({ code: 'EXPIRED' })
      await expect(run(tx => context.invitations.declineInvitation(tx, { token, user: null }))).rejects.toMatchObject({
        code: 'EXPIRED',
      })
      expect(await membershipOf(context.ids.stranger)).toBeUndefined()
    })

    it('rotates the token when an expired invitation is resent', async () => {
      const { event: first, invitation, token } = await invite(email('resent'))
      await expire(invitation.id)
      await context.client.db
        .update(context.schema.organizationInvitations)
        .set({ lastSentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() })
        .where(eq(context.schema.organizationInvitations.id, invitation.id))

      const resent = await run(tx =>
        context.invitations.resendInvitation(tx, {
          actorId: context.ids.owner,
          expiryDays: 7,
          invitationId: invitation.id,
          organizationId: context.organizationId,
        })
      )

      expect(resent.token).not.toBe(token)
      expect(resent.invitation.tokenHash).toBe(hashToken(resent.token))
      expect(resent.invitation.tokenHash).not.toBe(invitation.tokenHash)
      expect(openToken(resent.invitation.tokenCipher)).toBe(resent.token)
      await expect(accept(token, user('stranger'))).rejects.toMatchObject({ code: 'NOT_FOUND' })
      expect(Date.parse(`${resent.invitation.expiresAt.replace(' ', 'T')}Z`)).toBeGreaterThan(Date.now())
      const attempt = (proof: string) =>
        run(tx =>
          context.invitations.acceptInvitationWithNewAccount(tx, {
            passwordHash: 'hash',
            proof,
            token: resent.token,
          })
        )
      await expect(attempt(proofOf(first.data.url))).rejects.toMatchObject({ code: 'PROOF_REQUIRED' })
      await expect(attempt(proofOf(resent.event.data.url))).resolves.toMatchObject({ email: email('resent') })
    })

    it('throttles a resend that follows the first send', async () => {
      const { invitation } = await invite(email('throttled'))

      await expect(
        run(tx =>
          context.invitations.resendInvitation(tx, {
            actorId: context.ids.owner,
            expiryDays: 7,
            invitationId: invitation.id,
            organizationId: context.organizationId,
          })
        )
      ).rejects.toMatchObject({ code: 'TOO_SOON' })
    })
  })

  describe('revoke', () => {
    const revoke = (invitationId: number, organizationId = context.organizationId) =>
      run(tx => context.invitations.revokeInvitation(tx, { actorId: context.ids.owner, invitationId, organizationId }))

    it('kills the token and records the event', async () => {
      const { invitation, token } = await invite(email('revoked'))

      await revoke(invitation.id)

      await expect(accept(token, user('stranger'))).rejects.toMatchObject({ code: 'REVOKED' })
      await expect(run(tx => context.invitations.declineInvitation(tx, { token, user: null }))).rejects.toMatchObject({
        code: 'REVOKED',
      })
      const events = await eventsFor('invitation.revoked')
      expect(events.some(({ subjectId }) => subjectId === String(invitation.id))).toBe(true)
    })

    it('frees the address for a new invitation', async () => {
      const first = await invite(email('reinvited'))
      await revoke(first.invitation.id)

      const second = await invite(email('reinvited'))

      expect(second.invitation.id).not.toBe(first.invitation.id)
    })

    it('cannot revoke a settled invitation or one from another organization', async () => {
      const { invitation, token } = await invite(email('settled'))
      await run(tx => context.invitations.declineInvitation(tx, { token, user: null }))

      await expect(revoke(invitation.id)).rejects.toMatchObject({ code: 'DECLINED' })
      await expect(revoke(invitation.id, context.organizationId + 100_000)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('revealing the token', () => {
    const reveal = (invitation: { id: number; tokenCipher: string | null }) =>
      run(tx => context.invitations.revealInvitationToken(tx, invitation))

    const stored = async (invitationId: number) => {
      const row = await context.client.db.query.organizationInvitations.findFirst({
        where: eq(context.schema.organizationInvitations.id, invitationId),
      })
      if (!row) throw new Error('Invitation missing')
      return row
    }

    it('returns the same token while the seal is present', async () => {
      const { invitation, token } = await invite(email('revealed'))

      expect(await reveal(invitation)).toBe(token)

      const row = await stored(invitation.id)
      expect(row.tokenHash).toBe(hashToken(token))
      expect(row.tokenCipher).toBe(invitation.tokenCipher)
    })

    it('rotates the token of a legacy row whose seal is missing', async () => {
      const { invitation, token } = await invite(email('legacy'), { role: 'tutor' })
      await context.client.db
        .update(context.schema.organizationInvitations)
        .set({ tokenCipher: null })
        .where(eq(context.schema.organizationInvitations.id, invitation.id))

      const rotated = await reveal({ id: invitation.id, tokenCipher: null })

      expect(rotated).not.toBe(token)
      const row = await stored(invitation.id)
      expect(row.tokenHash).toBe(hashToken(rotated))
      expect(row.tokenHash).not.toBe(invitation.tokenHash)
      expect(openToken(row.tokenCipher)).toBe(rotated)
      await expect(accept(token, user('stranger'))).rejects.toMatchObject({ code: 'NOT_FOUND' })
      await expect(accept(rotated, user('stranger'))).rejects.toMatchObject({ code: 'MISMATCH' })
      expect(await reveal(row)).toBe(rotated)
    })
  })

  describe('opening as the recipient', () => {
    const open = (invitationId: number, key: keyof typeof context.ids) =>
      run(tx => context.invitations.openRecipientInvitation(tx, { invitationId, user: user(key) }))

    it('returns the token to the invited account', async () => {
      const { invitation, token } = await invite(email('invitee'))

      expect(await open(invitation.id, 'invitee')).toBe(token)
    })

    it('rejects a different account with MISMATCH', async () => {
      const { invitation } = await invite(email('invitee'))

      await expect(open(invitation.id, 'stranger')).rejects.toMatchObject({ code: 'MISMATCH' })
    })
  })

  describe('mismatch', () => {
    it('refuses another account and leaves the invitation pending', async () => {
      const { invitation, token } = await invite(email('invitee'))

      await expect(accept(token, user('stranger'))).rejects.toMatchObject({ code: 'MISMATCH' })

      const stored = await context.client.db.query.organizationInvitations.findFirst({
        where: eq(context.schema.organizationInvitations.id, invitation.id),
      })
      expect(stored?.acceptedAt).toBeNull()
      expect(await membershipOf(context.ids.stranger)).toBeUndefined()
    })

    it('binds an invitation to the account that existed when it was sent', async () => {
      const { token } = await invite(email('invitee'))

      await expect(accept(token, { email: email('invitee'), id: context.ids.stranger })).rejects.toMatchObject({
        code: 'MISMATCH',
      })
    })
  })
})
