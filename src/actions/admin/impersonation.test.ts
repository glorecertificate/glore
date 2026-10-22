import { randomUUID } from 'node:crypto'

import { and, eq, isNull } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Jar } from '@/lib/test-jar'

import { createAdminFixture, isLocalDatabase } from './test-harness'

const current = vi.hoisted(() => ({
  auditDown: false,
  jar: null as null | { apply: (headers: Headers) => void; headers: () => Headers },
}))

vi.mock('next/headers', async importOriginal => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  headers: () => Promise.resolve(current.jar?.headers() ?? new Headers()),
}))
vi.mock('next/server', async importOriginal => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: () => Promise.resolve(),
}))
vi.mock('next/cache', async importOriginal => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
  isRateLimited: () => Promise.resolve(false),
}))
vi.mock('@/db/mutations/activity-event', async importOriginal => {
  const original = await importOriginal<typeof import('@/db/mutations/activity-event')>()
  return {
    ...original,
    recordEvent: (...args: Parameters<typeof original.recordEvent>) =>
      current.auditDown ? Promise.reject(new Error('Audit store is down')) : original.recordEvent(...args),
  }
})

const PASSWORD = 'Password1!'
const KEYS = ['admin', 'banned', 'doomed', 'editor', 'otherAdmin', 'pending', 'user'] as const

type Key = (typeof KEYS)[number]

describe.skipIf(!isLocalDatabase)('impersonation', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<Key>>>
  let actions: typeof import('@/actions/admin/impersonation')
  let state: typeof import('@/actions/admin/impersonation-state')
  let sessionActions: typeof import('@/actions/account/sessions')
  let account: typeof import('@/actions/account/delete')
  let route: typeof import('@/app/api/auth/[...all]/route')

  const as = (jar: Jar | null) => {
    current.jar = jar
  }

  const start = async (jar: Jar, userId: string, reason = 'Helping with a support ticket') => {
    as(jar)
    return await actions.startImpersonation({ reason, userId })
  }

  const stop = async (jar: Jar) => {
    as(jar)
    return await actions.stopImpersonation()
  }

  const currentUser = async (jar: Jar) =>
    (await fixture.auth.api.getSession({ headers: jar.headers(), query: { disableCookieCache: true } }))?.user.id

  const reject = async (work: () => Promise<unknown>) => {
    try {
      await work()
    } catch (error) {
      return error as { body?: { code?: string }; status?: string }
    }
    throw new Error('Expected the call to be rejected')
  }

  const eventsFor = async (action: string, userId: string) =>
    await fixture.client.db.query.activityEvents.findMany({
      where: and(eq(fixture.schema.activityEvents.action, action), eq(fixture.schema.activityEvents.subjectId, userId)),
    })

  const sessionRow = async (id: string) =>
    await fixture.client.db.query.sessions.findFirst({ where: eq(fixture.schema.sessions.id, id) })

  const started = async (jar: Jar, userId: string, reason?: string) => {
    const result = await start(jar, userId, reason)
    if (!result.data) throw new Error(`Start failed: ${result.error?.code}`)
    return result.data
  }

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS, {
      admins: ['admin', 'doomed', 'otherAdmin'],
      editors: ['editor'],
      pending: ['pending'],
    })
    await fixture.client.db
      .update(fixture.schema.users)
      .set({ banReason: 'Spam account', banned: true })
      .where(eq(fixture.schema.users.id, fixture.ids.banned))
    ;[actions, state, sessionActions, account, route] = await Promise.all([
      import('@/actions/admin/impersonation'),
      import('@/actions/admin/impersonation-state'),
      import('@/actions/account/sessions'),
      import('@/actions/account/delete'),
      import('@/app/api/auth/[...all]/route'),
    ])
  }, 60_000)

  beforeEach(() => {
    const api = fixture.auth.api as unknown as Record<string, (context: Record<string, unknown>) => Promise<unknown>>
    for (const name of ['impersonateUser', 'stopImpersonating']) {
      const original = api[name]
      if (!original) throw new Error(`Missing endpoint ${name}`)
      vi.spyOn(api, name).mockImplementation(async context => {
        const result = (await original({ ...context, returnHeaders: true })) as { headers: Headers; response: unknown }
        current.jar?.apply(result.headers)
        return context.returnHeaders ? result : result.response
      })
    }
  })

  afterAll(async () => {
    as(null)
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  it('lets a platform admin view as a user and return to the admin session', async () => {
    const jar = await fixture.signIn('admin')
    expect(await currentUser(jar)).toBe(fixture.ids.admin)

    const result = await started(jar, fixture.ids.user, 'Helping with a support ticket')
    expect(result.userId).toBe(fixture.ids.user)
    expect(jar.has('admin_session')).toBe(true)
    expect(await currentUser(jar)).toBe(fixture.ids.user)
    expect(await sessionRow(result.sessionId)).toMatchObject({
      impersonatedBy: fixture.ids.admin,
      userId: fixture.ids.user,
    })

    as(jar)
    expect(await state.getImpersonation()).toMatchObject({
      adminId: fixture.ids.admin,
      reason: 'Helping with a support ticket',
      sessionId: result.sessionId,
      userId: fixture.ids.user,
    })
    expect(await state.isImpersonating()).toBe(true)
    const remaining = new Date(result.expiresAt).getTime() - Date.now()
    expect(remaining).toBeGreaterThan(14 * 60 * 1000)
    expect(remaining).toBeLessThanOrEqual(15 * 60 * 1000)

    const stopped = await stop(jar)
    expect(stopped.error).toBeNull()
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
    expect(await state.getImpersonation()).toBeNull()
    expect(await state.isImpersonating()).toBe(false)
    expect(await sessionRow(result.sessionId)).toBeUndefined()
  })

  it('audit logs every start and stop with the reason and the session', async () => {
    const jar = await fixture.signIn('admin')
    const reason = `Reproducing a bug report ${fixture.suffix}`
    const { sessionId } = await started(jar, fixture.ids.editor, reason)
    await stop(jar)

    const begin = (await eventsFor('impersonation.started', fixture.ids.editor)).find(
      row => row.metadata.sessionId === sessionId
    )
    expect(begin).toMatchObject({ actorId: fixture.ids.admin, subjectType: 'user' })
    expect(begin?.metadata).toMatchObject({ reason, sessionId })
    expect(typeof begin?.metadata.expiresAt).toBe('string')
    const end = (await eventsFor('impersonation.stopped', fixture.ids.editor)).find(
      row => row.metadata.sessionId === sessionId
    )
    expect(end).toMatchObject({ actorId: fixture.ids.admin })
    expect(end?.metadata).toMatchObject({ reason, sessionId })
  })

  it('refuses everyone but platform admins', async () => {
    as(null)
    expect((await actions.startImpersonation({ reason: 'A valid reason', userId: fixture.ids.user })).error?.code).toBe(
      'UNAUTHORIZED'
    )
    for (const key of ['user', 'editor'] as const) {
      const jar = await fixture.signIn(key)
      const result = await start(jar, fixture.ids.pending)
      expect(result.error?.code).toBe('FORBIDDEN')
      expect(await currentUser(jar)).toBe(fixture.ids[key])
      expect(jar.has('admin_session')).toBe(false)
    }
  })

  it('refuses to impersonate admins, banned users, pending users, yourself, or unknown ids', async () => {
    const jar = await fixture.signIn('admin')
    const codes = await Promise.all(
      [fixture.ids.otherAdmin, fixture.ids.admin, fixture.ids.banned, fixture.ids.pending, randomUUID()].map(
        async userId => (await start(jar, userId)).error?.code
      )
    )
    expect(codes).toEqual([
      'CANNOT_IMPERSONATE_ADMINS',
      'CANNOT_IMPERSONATE_SELF',
      'TARGET_BANNED',
      'NOT_ONBOARDED',
      'USER_NOT_FOUND',
    ])
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
  })

  it('keeps the stock admin plugin from impersonating admins or serving other users', async () => {
    const jar = await fixture.signIn('admin')
    const refused = await reject(() =>
      fixture.auth.api.impersonateUser({ body: { userId: fixture.ids.otherAdmin }, headers: jar.headers() })
    )
    expect(refused.status).toBe('FORBIDDEN')

    const plain = await fixture.signIn('user')
    const denied = await reject(() =>
      fixture.auth.api.impersonateUser({ body: { userId: fixture.ids.editor }, headers: plain.headers() })
    )
    expect(denied.status).toBe('FORBIDDEN')
    expect(await currentUser(plain)).toBe(fixture.ids.user)
  })

  it('requires a reason', async () => {
    const jar = await fixture.signIn('admin')
    const before = (await eventsFor('impersonation.started', fixture.ids.editor)).length
    expect((await start(jar, fixture.ids.editor, 'short')).error?.code).toBe('INVALID_INPUT')
    expect((await start(jar, fixture.ids.editor, '   ')).error?.code).toBe('INVALID_INPUT')
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
    expect(await eventsFor('impersonation.started', fixture.ids.editor)).toHaveLength(before)
  })

  it('refuses a second impersonation while one is active', async () => {
    const jar = await fixture.signIn('admin')
    await started(jar, fixture.ids.user)
    expect((await start(jar, fixture.ids.editor)).error?.code).toBe('ALREADY_IMPERSONATING')
    expect(await currentUser(jar)).toBe(fixture.ids.user)
    await stop(jar)
  })

  it('blocks security changes while impersonating', async () => {
    const jar = await fixture.signIn('admin')
    await started(jar, fixture.ids.user)
    const headers = jar.headers()

    const attempts = [
      () =>
        fixture.auth.api.changePassword({
          body: { currentPassword: PASSWORD, newPassword: 'Another-Pass-2!' },
          headers,
        }),
      () => fixture.auth.api.changeEmail({ body: { newEmail: `moved-${fixture.suffix}@admin-lane.test` }, headers }),
      () => fixture.auth.api.revokeOtherSessions({ headers }),
      () => fixture.auth.api.revokeSessions({ headers }),
    ]
    const codes = await Promise.all(attempts.map(async attempt => (await reject(attempt)).body?.code))
    expect(codes).toEqual(Array(attempts.length).fill('NOT_ALLOWED_WHILE_IMPERSONATING'))

    as(jar)
    const revoke = await sessionActions.revokeOtherSessions()
    expect(revoke.error?.code).toBe('NOT_ALLOWED_WHILE_IMPERSONATING')
    const one = await sessionActions.revokeSession(randomUUID())
    expect(one.error?.code).toBe('NOT_ALLOWED_WHILE_IMPERSONATING')
    expect(await currentUser(jar)).toBe(fixture.ids.user)

    await stop(jar)
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
  })

  it('locks account deletion while impersonating', async () => {
    const jar = await fixture.signIn('admin')
    await started(jar, fixture.ids.user)

    as(jar)
    expect(await account.deleteAccount('')).toMatchObject({ error: { code: 'NOT_ALLOWED_WHILE_IMPERSONATING' } })
    expect(await fixture.findUser('user')).toBeDefined()

    await stop(jar)
  })

  it('does not treat a normal session as impersonated', async () => {
    const jar = await fixture.signIn('user')
    as(jar)
    expect(await state.getImpersonation()).toBeNull()
    expect(await state.isImpersonating()).toBe(false)
    expect((await stop(jar)).error?.code).toBe('NOT_IMPERSONATING')
    expect(await currentUser(jar)).toBe(fixture.ids.user)
  })

  it('ends the impersonated session at the expiry and reports there is nothing to stop', async () => {
    const jar = await fixture.signIn('admin')
    const { sessionId } = await started(jar, fixture.ids.user)
    await fixture.client.db
      .update(fixture.schema.sessions)
      .set({ expiresAt: new Date(Date.now() - 60_000).toISOString() })
      .where(eq(fixture.schema.sessions.id, sessionId))
    for (const name of jar.cookies.keys()) {
      if (name.includes('session_data')) jar.cookies.delete(name)
    }

    as(jar)
    expect(await state.getImpersonation()).toBeNull()
    expect(await currentUser(jar)).toBeUndefined()
    expect((await stop(jar)).error?.code).toBe('NOT_IMPERSONATING')
    expect(await sessionRow(sessionId)).toBeUndefined()
    expect(
      (await eventsFor('impersonation.stopped', fixture.ids.user)).some(row => row.metadata.sessionId === sessionId)
    ).toBe(false)
  })

  it('does not let another signed in user reuse a stale admin cookie', async () => {
    const jar = await fixture.signIn('admin')
    await started(jar, fixture.ids.user)
    const adminCookie = [...jar.cookies].find(([name]) => name.includes('admin_session'))
    expect(adminCookie).toBeDefined()

    const other = await fixture.signIn('editor')
    if (adminCookie) other.cookies.set(adminCookie[0], adminCookie[1])
    expect((await stop(other)).error?.code).toBe('NOT_IMPERSONATING')
    expect(await currentUser(other)).toBe(fixture.ids.editor)
    await stop(jar)
  })

  it('drops the admin cookie when the impersonated user signs out', async () => {
    const jar = await fixture.signIn('admin')
    await started(jar, fixture.ids.user)
    expect(jar.has('admin_session')).toBe(true)

    as(null)
    const result = await fixture.auth.api.signOut({ headers: jar.headers(), returnHeaders: true })
    jar.apply(result.headers)
    expect(jar.has('admin_session')).toBe(false)
    expect(await currentUser(jar)).toBeUndefined()
    expect((await stop(jar)).error?.code).toBe('NOT_IMPERSONATING')
  })

  it('ends the impersonation when the admin account is deleted', async () => {
    const jar = await fixture.signIn('doomed')
    const { sessionId } = await started(jar, fixture.ids.user)
    expect(await sessionRow(sessionId)).toBeDefined()

    await fixture.client.db.delete(fixture.schema.users).where(eq(fixture.schema.users.id, fixture.ids.doomed))
    expect(await sessionRow(sessionId)).toBeUndefined()
    expect(await currentUser(jar)).toBeUndefined()
  })

  it('leaves no impersonation session when the start audit fails', async () => {
    const jar = await fixture.signIn('admin')
    const open = () =>
      fixture.client.db.query.sessions.findMany({
        where: and(
          eq(fixture.schema.sessions.impersonatedBy, fixture.ids.admin),
          eq(fixture.schema.sessions.userId, fixture.ids.editor)
        ),
      })
    const before = (await open()).length

    current.auditDown = true
    const result = await start(jar, fixture.ids.editor)
    current.auditDown = false

    expect(result.error).not.toBeNull()
    expect(await open()).toHaveLength(before)
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
  })

  it('keeps the session when the stop audit fails so the stop can be retried', async () => {
    const jar = await fixture.signIn('admin')
    await started(jar, fixture.ids.user)

    current.auditDown = true
    const failed = await stop(jar)
    current.auditDown = false

    expect(failed.error).not.toBeNull()
    expect(await currentUser(jar)).toBe(fixture.ids.user)
    expect((await stop(jar)).error).toBeNull()
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
  })

  it('closes the impersonation session when the admin session cannot be restored', async () => {
    const jar = await fixture.signIn('admin')
    const { sessionId } = await started(jar, fixture.ids.user)
    await fixture.client.db
      .delete(fixture.schema.sessions)
      .where(and(eq(fixture.schema.sessions.userId, fixture.ids.admin), isNull(fixture.schema.sessions.impersonatedBy)))

    const result = await stop(jar)
    expect(result.error).not.toBeNull()
    expect(await sessionRow(sessionId)).toBeUndefined()
    expect(await currentUser(jar)).toBeUndefined()
  })

  it('keeps the stock impersonation endpoints closed over HTTP', async () => {
    const jar = await fixture.signIn('admin')
    const responses = await Promise.all(
      ['impersonate-user', 'stop-impersonating'].map(
        async path =>
          await route.POST(
            new Request(`http://localhost:3000/api/auth/admin/${path}`, {
              body: JSON.stringify({ userId: fixture.ids.user }),
              headers: new Headers({
                'content-type': 'application/json',
                cookie: jar.header(),
                origin: 'http://localhost:3000',
              }),
              method: 'POST',
            })
          )
      )
    )
    expect(responses.map(response => response.status)).toEqual([404, 404])
    expect(await currentUser(jar)).toBe(fixture.ids.admin)
  })
})
