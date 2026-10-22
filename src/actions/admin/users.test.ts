import { randomUUID } from 'node:crypto'

import { and, eq, inArray, ne, or, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Jar } from '@/lib/test-jar'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const current = vi.hoisted(() => ({ cookie: '', limited: false }))

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
vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: current.limited, remaining: 1 }),
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')
const PASSWORD = 'Password1!'
const DAY = 24 * 60 * 60 * 1000
const suffix = randomUUID().slice(0, 8)
const KEYS = ['admin', 'banned', 'editor', 'member', 'otherAdmin', 'pending', 'target', 'user'] as const
const BULK = 22

type Key = (typeof KEYS)[number]

describe.skipIf(!isLocalDatabase)('admin users', () => {
  let context: {
    actions: typeof import('@/actions/admin/users')
    auth: typeof import('@/lib/auth').auth
    client: typeof import('@/db/client')
    impersonation: typeof import('@/actions/admin/impersonation')
    options: typeof import('@/actions/admin/options')
    moderation: typeof import('@/db/mutations/moderation')
    schema: typeof import('@/db/schema')
    ids: Record<Key, string>
    organizationId: number
  }
  const emails = Object.fromEntries(KEYS.map(key => [key, `${key}-${suffix}@admin-users.test`])) as Record<Key, string>
  const jars = {} as Record<Key, Jar>

  const as = (key: Key | null) => {
    current.cookie = key ? jars[key].header() : ''
    current.limited = false
  }

  const signIn = async (key: Key) => {
    const jar = new Jar()
    const result = await context.auth.api.signInEmail({
      body: { email: emails[key], password: PASSWORD },
      returnHeaders: true,
    })
    jar.apply(result.headers)
    return jar
  }

  const eventsFor = async (action: string, userId: string) =>
    await context.client.db.query.activityEvents.findMany({
      where: and(eq(context.schema.activityEvents.action, action), eq(context.schema.activityEvents.subjectId, userId)),
    })

  const findUser = async (key: Key) => {
    const row = await context.client.db.query.users.findFirst({
      where: eq(context.schema.users.id, context.ids[key]),
    })
    if (!row) throw new Error('User disappeared')
    return row
  }

  const reset = async (key: Key) => {
    await context.client.db
      .update(context.schema.users)
      .set({ banExpires: null, banReason: null, banned: false })
      .where(eq(context.schema.users.id, context.ids[key]))
  }

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    const [actions, { auth }, client, impersonation, moderation, schema, options] = await Promise.all([
      import('@/actions/admin/users'),
      import('@/lib/auth'),
      import('@/db/client'),
      import('@/actions/admin/impersonation'),
      import('@/db/mutations/moderation'),
      import('@/db/schema'),
      import('@/actions/admin/options'),
    ])
    const ids = {} as Record<Key, string>
    for (const key of KEYS) {
      const created = await auth.api.signUpEmail({
        body: { email: emails[key], firstName: key, name: key, password: PASSWORD },
      })
      ids[key] = created.user.id
    }
    const { db } = client
    await db.insert(schema.users).values(
      Array.from({ length: BULK }, (_, index) => ({
        email: `bulk-${index}-${suffix}@admin-users.test`,
        firstName: 'Bulk',
        id: `admin-users-${suffix}-${index}`,
        name: 'Bulk',
      }))
    )
    const onboarded = [ids.admin, ids.banned, ids.editor, ids.member, ids.otherAdmin, ids.target, ids.user]
    await db
      .update(schema.users)
      .set({ onboardedAt: new Date().toISOString() })
      .where(inArray(schema.users.id, onboarded))
    await db
      .update(schema.users)
      .set({ role: 'admin' })
      .where(inArray(schema.users.id, [ids.admin, ids.otherAdmin]))
    await db.update(schema.users).set({ isEditor: true }).where(eq(schema.users.id, ids.editor))
    await db
      .update(schema.users)
      .set({ banReason: 'Spam account', banned: true })
      .where(eq(schema.users.id, ids.banned))
    const [organization] = await db
      .insert(schema.organizations)
      .values({
        city: 'Milan',
        email: `org-${suffix}@admin-users.test`,
        handle: `admin-users-${suffix}`,
        name: `Org ${suffix}`,
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to insert organization')
    await db
      .insert(schema.memberships)
      .values({ organizationId: organization.id, role: 'volunteer', userId: ids.member })

    context = {
      actions,
      auth,
      client,
      ids,
      impersonation,
      moderation,
      options,
      organizationId: organization.id,
      schema,
    }
    for (const key of ['admin', 'editor', 'otherAdmin', 'user'] as const) jars[key] = await signIn(key)
  }, 60_000)

  afterAll(async () => {
    const { db } = context.client
    const userIds = Object.values(context.ids)
    await db
      .delete(context.schema.activityEvents)
      .where(
        or(
          inArray(context.schema.activityEvents.actorId, userIds),
          inArray(context.schema.activityEvents.subjectId, userIds)
        )
      )
    await db.delete(context.schema.organizations).where(eq(context.schema.organizations.id, context.organizationId))
    await db.delete(context.schema.users).where(inArray(context.schema.users.id, userIds))
    await db.delete(context.schema.users).where(
      inArray(
        context.schema.users.email,
        Array.from({ length: BULK }, (_, index) => `bulk-${index}-${suffix}@admin-users.test`)
      )
    )
    vi.unstubAllEnvs()
  })

  describe('guards', () => {
    it('refuses every action to signed out visitors', async () => {
      as(null)
      const results = await Promise.all([
        context.actions.listAdminUsers({}),
        context.actions.banUser({ reason: 'A valid reason', userId: context.ids.target }),
        context.actions.unbanUser(context.ids.banned),
        context.actions.updateUserRole(context.ids.target, 'editor'),
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: context.ids.target }),
      ])
      expect(results.map(result => result.error?.code)).toEqual(Array(5).fill('UNAUTHORIZED'))
      expect((await findUser('banned')).banned).toBe(true)
    })

    it.each(['user', 'editor'] as const)('refuses every action to a platform %s', async key => {
      as(key)
      const results = await Promise.all([
        context.actions.listAdminUsers({}),
        context.options.listAdminOrganizationOptions(),
        context.actions.banUser({ reason: 'A valid reason', userId: context.ids.target }),
        context.actions.unbanUser(context.ids.banned),
        context.actions.updateUserRole(context.ids.target, 'editor'),
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: context.ids.target }),
      ])
      expect(results.map(result => result.error?.code)).toEqual(Array(6).fill('FORBIDDEN'))
      expect((await findUser('target')).banned).toBe(false)
      expect((await findUser('target')).isEditor).toBe(false)
      expect((await findUser('banned')).banned).toBe(true)
    })

    it('stops every write when the admin is rate limited', async () => {
      as('admin')
      current.limited = true
      const results = await Promise.all([
        context.actions.banUser({ reason: 'A valid reason', userId: context.ids.target }),
        context.actions.updateUserRole(context.ids.target, 'editor'),
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: context.ids.target }),
      ])
      expect(results.map(result => result.error?.code)).toEqual(Array(3).fill('RATE_LIMITED'))
      expect((await findUser('target')).banned).toBe(false)
    })
  })

  describe('listing', () => {
    const search = (query: Parameters<typeof context.actions.listAdminUsers>[0]) =>
      context.actions.listAdminUsers({ q: suffix, ...query })

    it('pages on the server and clamps the page', async () => {
      as('admin')
      const first = await search({})
      expect(first.data?.total).toBe(KEYS.length + BULK)
      expect(first.data?.rows).toHaveLength(first.data?.pageSize ?? 0)
      expect(first.data?.pageCount).toBe(2)

      const second = await search({ page: 2 })
      expect(second.data?.rows).toHaveLength(KEYS.length + BULK - (first.data?.pageSize ?? 0))
      const overlap = second.data?.rows.filter(row => first.data?.rows.some(other => other.id === row.id))
      expect(overlap).toEqual([])

      const clamped = await search({ page: 99 })
      expect(clamped.data?.page).toBe(2)
    })

    it('filters by role, status, ban state, organization, and search text', async () => {
      as('admin')
      const ids = async (query: Parameters<typeof search>[0]) =>
        (await search(query)).data?.rows.map(row => row.id).sort()

      expect(await ids({ role: 'admin' })).toEqual([context.ids.admin, context.ids.otherAdmin].sort())
      expect(await ids({ role: 'editor' })).toEqual([context.ids.editor])
      expect(await ids({ banned: 'yes' })).toEqual([context.ids.banned])
      expect((await search({ banned: 'no' })).data?.total).toBe(KEYS.length + BULK - 1)
      expect(await ids({ organizationId: context.organizationId })).toEqual([context.ids.member])
      expect((await search({ status: 'pending' })).data?.total).toBe(BULK + 1)
      expect((await search({ status: 'active' })).data?.total).toBe(KEYS.length - 1)
      expect(await ids({ q: `target ${suffix}` })).toEqual([context.ids.target])
      expect(await ids({ q: `${suffix} 100%_` })).toEqual([])
      expect((await search({ role: 'user', status: 'pending' })).data?.total).toBe(BULK + 1)
    })

    it('rejects malformed queries', async () => {
      as('admin')
      const result = await context.actions.listAdminUsers({ page: 0, role: 'owner' as never })
      expect(result.error?.code).toBe('INVALID_INPUT')
    })

    it('treats an expired ban as not banned', async () => {
      as('admin')
      await context.client.db
        .update(context.schema.users)
        .set({ banExpires: new Date(Date.now() - DAY).toISOString(), banReason: 'Old', banned: true })
        .where(eq(context.schema.users.id, context.ids.pending))
      const banned = await context.actions.listAdminUsers({ banned: 'yes', q: `pending ${suffix}` })
      expect(banned.data?.rows).toEqual([])
      const notBanned = await context.actions.listAdminUsers({ banned: 'no', q: `pending ${suffix}` })
      expect(notBanned.data?.rows.map(row => row.id)).toEqual([context.ids.pending])
      await reset('pending')
    })
  })

  describe('banning', () => {
    it('bans with a reason, revokes sessions, logs the event, and blocks sign in', async () => {
      const targetJar = await signIn('target')
      expect(await context.auth.api.getSession({ headers: targetJar.headers() })).not.toBeNull()

      as('admin')
      const reason = `Repeated spam reports ${suffix}`
      const expiresAt = new Date(Date.now() + 7 * DAY).toISOString()
      const result = await context.actions.banUser({ expiresAt, reason, userId: context.ids.target })
      expect(result.error).toBeNull()

      const row = await findUser('target')
      expect(row).toMatchObject({ banReason: reason, banned: true })
      expect(row.banExpires).not.toBeNull()
      expect(
        await context.auth.api.getSession({ headers: targetJar.headers(), query: { disableCookieCache: true } })
      ).toBeNull()
      const sessions = await context.client.db.query.sessions.findMany({
        where: eq(context.schema.sessions.userId, context.ids.target),
      })
      expect(sessions).toEqual([])

      const [event] = await eventsFor('account.suspended', context.ids.target)
      expect(event).toMatchObject({ actorId: context.ids.admin, subjectType: 'account' })
      expect(event?.metadata).toMatchObject({ expiresAt, reason })

      await expect(
        context.auth.api.signInEmail({ body: { email: emails.target, password: PASSWORD } })
      ).rejects.toMatchObject({ body: { code: 'BANNED_USER' } })
    })

    it('lifts a ban whose expiry passed at the next sign in', async () => {
      await context.client.db
        .update(context.schema.users)
        .set({ banExpires: new Date(Date.now() - DAY).toISOString() })
        .where(eq(context.schema.users.id, context.ids.target))
      const jar = await signIn('target')
      expect(await context.auth.api.getSession({ headers: jar.headers() })).not.toBeNull()
      expect((await findUser('target')).banned).toBe(false)
    })

    it('keeps a ban with a future expiry active at sign in', async () => {
      as('admin')
      await context.actions.banUser({
        expiresAt: new Date(Date.now() + DAY).toISOString(),
        reason: `Cooling off period ${suffix}`,
        userId: context.ids.target,
      })
      await expect(
        context.auth.api.signInEmail({ body: { email: emails.target, password: PASSWORD } })
      ).rejects.toMatchObject({ body: { code: 'BANNED_USER' } })
      await reset('target')
    })

    it('requires a reason between 10 and 500 characters', async () => {
      as('admin')
      const before = (await eventsFor('account.suspended', context.ids.user)).length
      const tooShort = await context.actions.banUser({ reason: 'short', userId: context.ids.user })
      const blank = await context.actions.banUser({ reason: '          ', userId: context.ids.user })
      const tooLong = await context.actions.banUser({ reason: 'x'.repeat(501), userId: context.ids.user })
      const missing = await context.actions.banUser({ userId: context.ids.user } as never)
      expect([tooShort, blank, tooLong, missing].map(result => result.error?.code)).toEqual(
        Array(4).fill('INVALID_INPUT')
      )
      expect((await findUser('user')).banned).toBe(false)
      expect(await eventsFor('account.suspended', context.ids.user)).toHaveLength(before)
    })

    it('rejects an expiry in the past', async () => {
      as('admin')
      const result = await context.actions.banUser({
        expiresAt: new Date(Date.now() - DAY).toISOString(),
        reason: 'A valid reason',
        userId: context.ids.user,
      })
      expect(result.error?.code).toBe('INVALID_INPUT')
      expect((await findUser('user')).banned).toBe(false)
    })

    it('never bans an admin or the acting admin, and reports unknown users', async () => {
      as('admin')
      const results = await Promise.all([
        context.actions.banUser({ reason: 'A valid reason', userId: context.ids.otherAdmin }),
        context.actions.banUser({ reason: 'A valid reason', userId: context.ids.admin }),
        context.actions.banUser({ reason: 'A valid reason', userId: randomUUID() }),
      ])
      expect(results.map(result => result.error?.code)).toEqual(['TARGET_IS_ADMIN', 'SELF', 'NOT_FOUND'])
      expect((await findUser('otherAdmin')).banned).toBeFalsy()
      expect((await findUser('admin')).banned).toBeFalsy()
    })

    it('unbans, logs the event, and refuses to unban someone who is not banned', async () => {
      as('admin')
      const result = await context.actions.unbanUser(context.ids.banned)
      expect(result.error).toBeNull()
      expect(await findUser('banned')).toMatchObject({ banExpires: null, banReason: null, banned: false })
      const [event] = await eventsFor('account.reinstated', context.ids.banned)
      expect(event).toMatchObject({ actorId: context.ids.admin })

      const again = await context.actions.unbanUser(context.ids.banned)
      expect(again.error?.code).toBe('NOT_BANNED')
      expect((await context.actions.unbanUser(randomUUID())).error?.code).toBe('NOT_FOUND')
    })
  })

  describe('platform roles', () => {
    it('promotes and demotes, logging each change', async () => {
      as('admin')
      const promote = await context.actions.updateUserRole(context.ids.user, 'editor')
      expect(promote.data).toMatchObject({ role: 'editor' })
      expect(await findUser('user')).toMatchObject({ isEditor: true, role: 'user' })

      await context.actions.updateUserRole(context.ids.user, 'admin')
      expect(await findUser('user')).toMatchObject({ isEditor: false, role: 'admin' })

      await context.actions.updateUserRole(context.ids.user, 'user')
      expect(await findUser('user')).toMatchObject({ isEditor: false, role: 'user' })

      const events = await eventsFor('team.role_changed', context.ids.user)
      expect(events.map(event => event.metadata.role)).toEqual(expect.arrayContaining(['editor', 'admin', null]))
      expect(events.every(event => event.actorId === context.ids.admin)).toBe(true)
    })

    it('refuses no-op, self, unknown, and invalid role changes', async () => {
      as('admin')
      const results = await Promise.all([
        context.actions.updateUserRole(context.ids.user, 'user'),
        context.actions.updateUserRole(context.ids.admin, 'user'),
        context.actions.updateUserRole(randomUUID(), 'editor'),
        context.actions.updateUserRole(context.ids.user, 'owner'),
      ])
      expect(results.map(result => result.error?.code)).toEqual(['NO_CHANGE', 'SELF', 'NOT_FOUND', 'INVALID_INPUT'])
      expect((await findUser('admin')).role).toBe('admin')
    })

    it('keeps at least one admin', async () => {
      const { db, transaction } = context.client
      const rollback = new Error('rollback')
      const outcome = await transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('platform-admins', 0))`)
        await tx.execute(sql`lock table users in exclusive mode`)
        await tx
          .update(context.schema.users)
          .set({ role: 'user' })
          .where(and(eq(context.schema.users.role, 'admin'), ne(context.schema.users.id, context.ids.otherAdmin)))
        const error = await context.moderation
          .setPlatformRole(tx, { actorId: context.ids.user, role: 'user', userId: context.ids.otherAdmin })
          .catch((caught: unknown) => caught)
        const remaining = await tx.query.users.findMany({ where: eq(context.schema.users.role, 'admin') })
        throw Object.assign(rollback, { error, remaining: remaining.length })
      }).catch((caught: unknown) => caught as Error & { error: { code: string }; remaining: number })
      expect(outcome).toBe(rollback)
      expect(outcome).toMatchObject({ error: { code: 'LAST_ADMIN' }, remaining: 0 })
      expect(
        (await db.query.users.findFirst({ where: eq(context.schema.users.id, context.ids.otherAdmin) }))?.role
      ).toBe('admin')
    })
  })

  describe('impersonation actions', () => {
    it('maps plugin errors to stable codes', async () => {
      as('admin')
      const results = await Promise.all([
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: context.ids.otherAdmin }),
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: context.ids.admin }),
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: context.ids.pending }),
        context.impersonation.startImpersonation({ reason: 'A valid reason', userId: randomUUID() }),
        context.impersonation.startImpersonation({ reason: 'short', userId: context.ids.target }),
      ])
      expect(results.map(result => result.error?.code)).toEqual([
        'CANNOT_IMPERSONATE_ADMINS',
        'CANNOT_IMPERSONATE_SELF',
        'NOT_ONBOARDED',
        'USER_NOT_FOUND',
        'INVALID_INPUT',
      ])
    })

    it('refuses banned targets', async () => {
      as('admin')
      await context.actions.banUser({ reason: 'Pending investigation', userId: context.ids.target })
      const result = await context.impersonation.startImpersonation({
        reason: 'A valid reason',
        userId: context.ids.target,
      })
      expect(result.error?.code).toBe('TARGET_BANNED')
      await reset('target')
    })

    it('starts a session and logs the reason', async () => {
      as('admin')
      const reason = `Reproducing a support ticket ${suffix}`
      const result = await context.impersonation.startImpersonation({ reason, userId: context.ids.target })
      expect(result.error).toBeNull()
      expect(result.data).toMatchObject({ userId: context.ids.target })
      const events = await eventsFor('impersonation.started', context.ids.target)
      expect(events.find(event => event.metadata.reason === reason)).toMatchObject({ actorId: context.ids.admin })
    })
  })
})
