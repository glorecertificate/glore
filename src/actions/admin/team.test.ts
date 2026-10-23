import { randomUUID } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { DAY, createAdminFixture, isLocalDatabase } from './test-harness'

const current = vi.hoisted(() => ({ cookie: '', delivered: 1, limited: false }))
const notifyMock = vi.hoisted(() => vi.fn())

vi.mock('next/headers', async importOriginal => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  headers: () => Promise.resolve(new Headers({ cookie: current.cookie })),
}))
vi.mock('next/cache', async importOriginal => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}))
vi.mock('@/actions/notifications/notify', () => ({ notify: notifyMock }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: current.limited, remaining: 1 }),
}))

const KEYS = ['admin', 'editor', 'member', 'plain'] as const

describe.skipIf(!isLocalDatabase)('admin team', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let actions: typeof import('@/actions/admin/team')
  const invitedIds: string[] = []

  const as = (key: (typeof KEYS)[number] | null) => {
    current.cookie = key ? (fixture.jars[key]?.header() ?? '') : ''
    current.limited = false
  }

  const invite = async (label: string, role: 'admin' | 'editor' = 'editor') => {
    as('admin')
    const email = `${label}-${fixture.suffix}@team-lane.test`
    const result = await actions.inviteTeamMember({ email, firstName: label, lastName: 'Invitee', locale: 'en', role })
    if (result.data) invitedIds.push(result.data.id)
    return { email, result }
  }

  const pendingInvitation = async (userId: string) => {
    const row = await fixture.client.db.query.teamInvitations.findFirst({
      where: and(eq(fixture.schema.teamInvitations.userId, userId)),
    })
    if (!row) throw new Error('Invitation missing')
    return row
  }

  const backdate = async (userId: string, patch: { expiresAt?: string; updatedAt?: string }) =>
    await fixture.client.db
      .update(fixture.schema.teamInvitations)
      .set(patch)
      .where(eq(fixture.schema.teamInvitations.userId, userId))

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS, { admins: ['admin'], editors: ['editor'] })
    actions = await import('@/actions/admin/team')
    for (const key of KEYS) await fixture.signIn(key)
  }, 60_000)

  beforeEach(() => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    notifyMock.mockReset()
    notifyMock.mockImplementation(() => Promise.resolve({ emailed: current.delivered, inApp: 1 }))
    current.delivered = 1
  })

  afterAll(async () => {
    const { db } = fixture.client
    const { activityEvents, teamInvitations, users } = fixture.schema
    await db.delete(activityEvents).where(inArray(activityEvents.subjectId, invitedIds))
    await db.delete(teamInvitations).where(inArray(teamInvitations.userId, invitedIds))
    await db.delete(users).where(inArray(users.id, invitedIds))
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  describe('guards', () => {
    it('refuses signed out visitors and non-admins', async () => {
      const calls = () =>
        Promise.all([
          actions.inviteTeamMember({
            email: `guard-${fixture.suffix}@team-lane.test`,
            firstName: 'Guard',
            lastName: '',
            locale: 'en',
            role: 'editor',
          }),
          actions.resendInvitation(fixture.ids.member),
          actions.updateTeamMemberRole(fixture.ids.member, 'editor'),
          actions.deleteTeamMember(fixture.ids.member),
        ])

      as(null)
      expect((await calls()).map(result => result.error?.code)).toEqual(Array(4).fill('UNAUTHORIZED'))
      for (const key of ['editor', 'plain'] as const) {
        as(key)
        expect((await calls()).map(result => result.error?.code)).toEqual(Array(4).fill('FORBIDDEN'))
      }
      expect(notifyMock).not.toHaveBeenCalled()
      expect(
        await fixture.client.db.query.users.findFirst({
          where: eq(fixture.schema.users.email, `guard-${fixture.suffix}@team-lane.test`),
        })
      ).toBeUndefined()
      expect((await fixture.findUser('member')).isEditor).toBe(false)
    })

    it('stops every write when the admin is rate limited', async () => {
      as('admin')
      current.limited = true
      const results = await Promise.all([
        actions.resendInvitation(fixture.ids.member),
        actions.updateTeamMemberRole(fixture.ids.member, 'editor'),
        actions.deleteTeamMember(fixture.ids.member),
      ])
      expect(results.map(result => result.error?.code)).toEqual(Array(3).fill('RATE_LIMITED'))
    })
  })

  describe('inviting', () => {
    it('creates the account, a 7 day invitation, an audit event, and sends the email', async () => {
      const { email, result } = await invite('first')
      expect(result.error).toBeNull()
      expect(result.data).toMatchObject({ email, role: 'editor' })

      const userId = result.data?.id ?? ''
      expect(
        await fixture.client.db.query.users.findFirst({ where: eq(fixture.schema.users.id, userId) })
      ).toMatchObject({
        isEditor: true,
        role: 'user',
      })
      const invitation = await pendingInvitation(userId)
      expect(invitation.acceptedAt).toBeNull()
      expect(invitation.invitedBy).toBe(fixture.ids.admin)
      const remaining = Date.parse(`${invitation.expiresAt.replace(' ', 'T')}Z`) - Date.now()
      expect(remaining).toBeGreaterThan(6.9 * DAY)
      expect(remaining).toBeLessThanOrEqual(7 * DAY)
      expect(invitation.token.length).toBeGreaterThanOrEqual(40)

      expect(notifyMock).toHaveBeenCalledTimes(1)
      const event = notifyMock.mock.calls[0]?.[0] as { data: { inviterName: string; url: string }; type: string }
      expect(event.type).toBe('team.invited')
      expect(event.data.inviterName).toBe('admin')
      expect(event.data.url).toBe(`http://localhost:3000/api/v1/join?token=${encodeURIComponent(invitation.token)}`)

      const [row] = await fixture.client.db.query.activityEvents.findMany({
        where: and(
          eq(fixture.schema.activityEvents.action, 'team.invited'),
          eq(fixture.schema.activityEvents.subjectId, userId)
        ),
      })
      expect(row).toMatchObject({ actorId: fixture.ids.admin })
      expect(JSON.stringify(row?.metadata)).not.toContain(invitation.token)
      expect(row?.metadata).toEqual({ inviterName: 'admin', name: 'first Invitee', role: 'editor', userId })
    })

    it('refuses duplicate emails, bad input, and unknown roles', async () => {
      as('admin')
      const results = await Promise.all([
        actions.inviteTeamMember({
          email: fixture.emails.member,
          firstName: 'Dup',
          lastName: '',
          locale: 'en',
          role: 'editor',
        }),
        actions.inviteTeamMember({
          email: 'not-an-email',
          firstName: 'Bad',
          lastName: '',
          locale: 'en',
          role: 'editor',
        }),
        actions.inviteTeamMember({
          email: `owner-${fixture.suffix}@team-lane.test`,
          firstName: 'Owner',
          lastName: '',
          locale: 'en',
          role: 'owner' as never,
        }),
        actions.inviteTeamMember({
          email: `blank-${fixture.suffix}@team-lane.test`,
          firstName: '   ',
          lastName: '',
          locale: 'en',
          role: 'admin',
        }),
      ])
      expect(results.map(result => result.error?.code)).toEqual([
        'EMAIL_TAKEN',
        'INVALID_INPUT',
        'INVALID_INPUT',
        'INVALID_INPUT',
      ])
      expect(notifyMock).not.toHaveBeenCalled()
    })

    it('keeps the invitation and reports a failed delivery', async () => {
      current.delivered = 0
      const { result } = await invite('undelivered')
      expect(result.error?.code).toBe('SEND_FAILED')
      const user = await fixture.client.db.query.users.findFirst({
        where: eq(fixture.schema.users.email, `undelivered-${fixture.suffix}@team-lane.test`),
      })
      expect(user).toBeDefined()
      if (user) invitedIds.push(user.id)
      expect(await pendingInvitation(user?.id ?? '')).toMatchObject({ acceptedAt: null })
    })
  })

  describe('resending', () => {
    it('refuses a second send inside the cooldown', async () => {
      const { result } = await invite('cooldown')
      const before = await pendingInvitation(result.data?.id ?? '')
      notifyMock.mockClear()

      const again = await actions.resendInvitation(result.data?.id ?? '')
      expect(again.error?.code).toBe('TOO_SOON')
      expect(await pendingInvitation(result.data?.id ?? '')).toMatchObject({ token: before.token })
      expect(notifyMock).not.toHaveBeenCalled()
    })

    it('refreshes the token and the expiry, records the event, and mails the new link', async () => {
      const { result } = await invite('refresh')
      const userId = result.data?.id ?? ''
      const before = await pendingInvitation(userId)
      await backdate(userId, {
        expiresAt: new Date(Date.now() + DAY).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      })
      notifyMock.mockClear()

      const resent = await actions.resendInvitation(userId)
      expect(resent.error).toBeNull()
      const after = await pendingInvitation(userId)
      expect(after.token).not.toBe(before.token)
      expect(after.token.length).toBeGreaterThanOrEqual(40)
      const remaining = Date.parse(`${after.expiresAt.replace(' ', 'T')}Z`) - Date.now()
      expect(remaining).toBeGreaterThan(6.9 * DAY)

      expect(JSON.stringify(resent)).not.toContain(after.token)
      expect(notifyMock).toHaveBeenCalledTimes(1)
      const event = notifyMock.mock.calls[0]?.[0] as { actorId: string; data: { url: string } }
      expect(event.actorId).toBe(fixture.ids.admin)
      expect(event.data.url).toContain(encodeURIComponent(after.token))
      expect(event.data.url).not.toContain(before.token)

      const events = await fixture.client.db.query.activityEvents.findMany({
        where: and(
          eq(fixture.schema.activityEvents.action, 'team.invited'),
          eq(fixture.schema.activityEvents.subjectId, userId)
        ),
      })
      expect(events).toHaveLength(2)
      expect(events.every(row => !JSON.stringify(row.metadata).includes(after.token))).toBe(true)
    })

    it('revives an expired invitation and blocks the old link', async () => {
      const { result } = await invite('expired')
      const userId = result.data?.id ?? ''
      const before = await pendingInvitation(userId)
      await backdate(userId, {
        expiresAt: new Date(Date.now() - 2 * DAY).toISOString(),
        updatedAt: new Date(Date.now() - 3 * DAY).toISOString(),
      })

      expect((await actions.resendInvitation(userId)).error).toBeNull()
      const after = await pendingInvitation(userId)
      expect(Date.parse(`${after.expiresAt.replace(' ', 'T')}Z`)).toBeGreaterThan(Date.now() + 6 * DAY)
      const stale = await fixture.client.db.query.teamInvitations.findFirst({
        where: eq(fixture.schema.teamInvitations.token, before.token),
      })
      expect(stale).toBeUndefined()
    })

    it('reports a failed delivery without losing the refreshed token', async () => {
      const { result } = await invite('flaky')
      const userId = result.data?.id ?? ''
      await backdate(userId, { updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() })
      const before = await pendingInvitation(userId)
      current.delivered = 0
      notifyMock.mockImplementation(() => Promise.resolve({ emailed: 0, inApp: 0 }))

      expect((await actions.resendInvitation(userId)).error?.code).toBe('SEND_FAILED')
      expect((await pendingInvitation(userId)).token).not.toBe(before.token)
    })

    it('finds nothing for accepted invitations and unknown users', async () => {
      const { result } = await invite('accepted')
      const userId = result.data?.id ?? ''
      await fixture.client.db
        .update(fixture.schema.teamInvitations)
        .set({ acceptedAt: new Date().toISOString(), updatedAt: new Date(Date.now() - DAY).toISOString() })
        .where(eq(fixture.schema.teamInvitations.userId, userId))
      as('admin')
      expect((await actions.resendInvitation(userId)).error?.code).toBe('NOT_FOUND')
      expect((await actions.resendInvitation(randomUUID())).error?.code).toBe('NOT_FOUND')
      expect((await actions.resendInvitation('')).error?.code).toBe('INVALID_INPUT')
    })
  })

  describe('roles and removal', () => {
    it('changes a team role through the platform role unit', async () => {
      as('admin')
      const result = await actions.updateTeamMemberRole(fixture.ids.editor, 'admin')
      expect(result.data).toMatchObject({ role: 'admin' })
      expect(await fixture.findUser('editor')).toMatchObject({ isEditor: false, role: 'admin' })
      const events = await fixture.client.db.query.activityEvents.findMany({
        where: and(
          eq(fixture.schema.activityEvents.action, 'team.role_changed'),
          eq(fixture.schema.activityEvents.subjectId, fixture.ids.editor)
        ),
      })
      expect(events).toHaveLength(1)
      expect(notifyMock).toHaveBeenCalledTimes(1)

      await actions.updateTeamMemberRole(fixture.ids.editor, 'editor')
    })

    it('refuses self changes, no-ops, and unknown roles', async () => {
      as('admin')
      const results = await Promise.all([
        actions.updateTeamMemberRole(fixture.ids.admin, 'editor'),
        actions.updateTeamMemberRole(fixture.ids.editor, 'editor'),
        actions.updateTeamMemberRole(fixture.ids.editor, 'user'),
        actions.deleteTeamMember(fixture.ids.admin),
      ])
      expect(results.map(result => result.error?.code)).toEqual(['SELF', 'NO_CHANGE', 'INVALID_INPUT', 'SELF'])
      expect((await fixture.findUser('admin')).role).toBe('admin')
    })
  })

  describe('deleting a team member', () => {
    const organizationIds: number[] = []
    const holderIds: string[] = []

    const createOrganization = async (label: string) => {
      const [organization] = await fixture.client.db
        .insert(fixture.schema.organizations)
        .values({
          city: 'Milan',
          email: `${label}-${fixture.suffix}@team-lane.test`,
          handle: `${label}-${fixture.suffix}`,
          name: label,
        })
        .returning({ id: fixture.schema.organizations.id })
      if (!organization) throw new Error('Failed to create the organization')
      organizationIds.push(organization.id)
      return organization.id
    }

    afterAll(async () => {
      const { db } = fixture.client
      const { activityEvents, certificates, memberships, organizations, users } = fixture.schema
      await db.delete(activityEvents).where(inArray(activityEvents.organizationId, organizationIds))
      await db.delete(certificates).where(inArray(certificates.organizationId, organizationIds))
      await db.delete(memberships).where(inArray(memberships.organizationId, organizationIds))
      await db.delete(organizations).where(inArray(organizations.id, organizationIds))
      await db.delete(users).where(inArray(users.id, holderIds))
    })

    it('refuses an account that is not on the team', async () => {
      as('admin')
      const result = await actions.deleteTeamMember(fixture.ids.plain)
      expect(result.error?.code).toBe('NOT_FOUND')
      expect(await fixture.findUser('plain')).toBeDefined()
    })

    it('refuses a team member who is the only admin of an organization', async () => {
      const { result } = await invite('sole-admin')
      const userId = result.data?.id ?? ''
      const organizationId = await createOrganization('sole-admin')
      await fixture.client.db.insert(fixture.schema.memberships).values({ organizationId, role: 'admin', userId })

      as('admin')
      expect((await actions.deleteTeamMember(userId)).error?.code).toBe('SOLE_ORG_ADMIN')
      expect(
        await fixture.client.db.query.users.findFirst({ where: eq(fixture.schema.users.id, userId) })
      ).toBeDefined()
    })

    it('erases the account, records the event and returns open reviews to the pool', async () => {
      const { result } = await invite('tutor-editor')
      const userId = result.data?.id ?? ''
      const organizationId = await createOrganization('tutor-editor')
      const holderId = `holder-${fixture.suffix}`
      holderIds.push(holderId)
      await fixture.client.db.insert(fixture.schema.users).values({
        email: `${holderId}@team-lane.test`,
        firstName: 'Holder',
        id: holderId,
        name: 'Holder',
      })
      await fixture.client.db.insert(fixture.schema.memberships).values([
        { organizationId, role: 'tutor', userId },
        { organizationId, role: 'volunteer', userId: holderId },
      ])
      const [certificate] = await fixture.client.db
        .insert(fixture.schema.certificates)
        .values({
          activityDescription: 'Helped',
          activityDuration: 120,
          activityEndDate: '2026-02-01',
          activityLocation: 'Milan',
          activityStartDate: '2026-01-01',
          handle: `team-removal-${fixture.suffix}`,
          language: 'en',
          organizationId,
          reviewerId: userId,
          status: 'in_review',
          userId: holderId,
        })
        .returning({ id: fixture.schema.certificates.id })
      notifyMock.mockClear()

      as('admin')
      const deleted = await actions.deleteTeamMember(userId)

      expect(deleted.error).toBeNull()
      expect(
        await fixture.client.db.query.users.findFirst({ where: eq(fixture.schema.users.id, userId) })
      ).toBeUndefined()
      expect(
        await fixture.client.db.query.certificates.findFirst({
          where: eq(fixture.schema.certificates.id, certificate?.id ?? 0),
        })
      ).toMatchObject({ reviewerId: null, status: 'submitted' })

      const events = await fixture.client.db.query.activityEvents.findMany({
        where: and(
          eq(fixture.schema.activityEvents.action, 'account.deleted'),
          eq(fixture.schema.activityEvents.subjectId, userId)
        ),
      })
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({ actorId: fixture.ids.admin })
      expect(JSON.stringify(events[0]?.metadata)).not.toContain('@team-lane.test')

      const notified = notifyMock.mock.calls.map(([event]) => (event as { type: string }).type)
      expect(notified).toContain('certificate.unassigned')
      expect(notified).not.toContain('account.deleted')
    })
  })
})
