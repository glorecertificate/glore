import { randomUUID } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Jar } from '@/lib/test-jar'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')
const PASSWORD = 'Password1!'
const suffix = randomUUID().slice(0, 8)

describe.skipIf(!isLocalDatabase)('impersonation', () => {
  let context: {
    auth: typeof import('@/lib/auth').auth
    client: typeof import('@/db/client')
    schema: typeof import('@/db/schema')
    ids: Record<'admin' | 'banned' | 'editor' | 'otherAdmin' | 'pending' | 'user', string>
  }
  const emails = Object.fromEntries(
    ['admin', 'banned', 'editor', 'otherAdmin', 'pending', 'user'].map(key => [
      key,
      `${key}-${suffix}@impersonation.test`,
    ])
  ) as Record<keyof typeof context.ids, string>

  const signIn = async (key: keyof typeof emails) => {
    const jar = new Jar()
    const result = await context.auth.api.signInEmail({
      body: { email: emails[key], password: PASSWORD },
      returnHeaders: true,
    })
    jar.apply(result.headers)
    return jar
  }

  const start = async (jar: Jar, userId: string, reason = 'Helping with a support ticket') => {
    const result = await context.auth.api.startImpersonation({
      body: { reason, userId },
      headers: jar.headers(),
      returnHeaders: true,
    })
    jar.apply(result.headers)
    return result.response
  }

  const stop = async (jar: Jar) => {
    const result = await context.auth.api.stopImpersonation({ headers: jar.headers(), returnHeaders: true })
    jar.apply(result.headers)
    return result.response
  }

  const currentUser = async (jar: Jar) => (await context.auth.api.getSession({ headers: jar.headers() }))?.user.id

  const reject = async (work: () => Promise<unknown>) => {
    try {
      await work()
    } catch (error) {
      return error as { body?: { code?: string }; status?: string }
    }
    throw new Error('Expected the call to be rejected')
  }

  const eventsFor = async (action: string, userId: string) =>
    await context.client.db.query.activityEvents.findMany({
      where: and(eq(context.schema.activityEvents.action, action), eq(context.schema.activityEvents.subjectId, userId)),
    })

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    const [{ auth }, client, schema] = await Promise.all([
      import('@/lib/auth'),
      import('@/db/client'),
      import('@/db/schema'),
    ])
    const ids = {} as typeof context.ids
    for (const key of Object.keys(emails) as (keyof typeof emails)[]) {
      const created = await auth.api.signUpEmail({
        body: { email: emails[key], firstName: key, name: key, password: PASSWORD },
      })
      ids[key] = created.user.id
    }
    const now = new Date().toISOString()
    await client.db
      .update(schema.users)
      .set({ onboardedAt: now })
      .where(inArray(schema.users.id, [ids.admin, ids.banned, ids.editor, ids.otherAdmin, ids.user]))
    await client.db
      .update(schema.users)
      .set({ role: 'admin' })
      .where(inArray(schema.users.id, [ids.admin, ids.otherAdmin]))
    await client.db.update(schema.users).set({ isEditor: true }).where(eq(schema.users.id, ids.editor))
    await client.db
      .update(schema.users)
      .set({ banReason: 'Spam account', banned: true })
      .where(eq(schema.users.id, ids.banned))
    context = { auth, client, ids, schema }
  })

  afterAll(async () => {
    const { db } = context.client
    const userIds = Object.values(context.ids)
    await db.delete(context.schema.activityEvents).where(inArray(context.schema.activityEvents.actorId, userIds))
    await db.delete(context.schema.users).where(inArray(context.schema.users.id, userIds))
    vi.unstubAllEnvs()
  })

  it('lets a platform admin view as a user and return to the admin session', async () => {
    const jar = await signIn('admin')
    expect(await currentUser(jar)).toBe(context.ids.admin)

    const started = await start(jar, context.ids.user, 'Helping with a support ticket')
    expect(started.userId).toBe(context.ids.user)
    expect(jar.has('admin_session')).toBe(true)
    expect(await currentUser(jar)).toBe(context.ids.user)

    const state = await context.auth.api.getImpersonation({ headers: jar.headers() })
    expect(state).toMatchObject({
      adminId: context.ids.admin,
      reason: 'Helping with a support ticket',
      userId: context.ids.user,
    })
    const remaining = new Date(state?.expiresAt ?? 0).getTime() - Date.now()
    expect(remaining).toBeGreaterThan(14 * 60 * 1000)
    expect(remaining).toBeLessThanOrEqual(15 * 60 * 1000)

    await stop(jar)
    expect(await currentUser(jar)).toBe(context.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
    expect(await context.auth.api.getImpersonation({ headers: jar.headers() })).toBeNull()
    const leftover = await context.client.db.query.sessions.findFirst({
      where: eq(context.schema.sessions.id, started.sessionId),
    })
    expect(leftover).toBeUndefined()
  })

  it('audit logs every start and stop with the reason', async () => {
    const jar = await signIn('admin')
    const reason = `Reproducing a bug report ${suffix}`
    const { sessionId } = await start(jar, context.ids.editor, reason)
    await stop(jar)

    const started = (await eventsFor('impersonation.started', context.ids.editor)).find(
      row => row.metadata.sessionId === sessionId
    )
    expect(started).toMatchObject({ actorId: context.ids.admin, subjectType: 'user' })
    expect(started?.metadata).toMatchObject({ reason, sessionId })
    const stopped = (await eventsFor('impersonation.stopped', context.ids.editor)).find(
      row => row.metadata.sessionId === sessionId
    )
    expect(stopped).toMatchObject({ actorId: context.ids.admin })
    expect(stopped?.metadata).toMatchObject({ reason, sessionId })
  })

  it('refuses everyone but platform admins', async () => {
    const jar = await signIn('user')
    const error = await reject(() => start(jar, context.ids.editor))
    expect(error.body?.code).toBe('FORBIDDEN')
    expect(await currentUser(jar)).toBe(context.ids.user)
  })

  it('refuses to impersonate admins, banned users, pending users, or yourself', async () => {
    const jar = await signIn('admin')
    expect((await reject(() => start(jar, context.ids.otherAdmin))).body?.code).toBe('CANNOT_IMPERSONATE_ADMINS')
    expect((await reject(() => start(jar, context.ids.admin))).body?.code).toBe('CANNOT_IMPERSONATE_SELF')
    expect((await reject(() => start(jar, context.ids.banned))).body?.code).toBe('TARGET_BANNED')
    expect((await reject(() => start(jar, context.ids.pending))).body?.code).toBe('NOT_ONBOARDED')
    expect((await reject(() => start(jar, randomUUID()))).body?.code).toBe('USER_NOT_FOUND')
    expect(await currentUser(jar)).toBe(context.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
  })

  it('requires a reason', async () => {
    const jar = await signIn('admin')
    const before = (await eventsFor('impersonation.started', context.ids.pending)).length
    await reject(() => start(jar, context.ids.editor, 'short'))
    await reject(() => start(jar, context.ids.editor, '   '))
    expect(await currentUser(jar)).toBe(context.ids.admin)
    expect(jar.has('admin_session')).toBe(false)
    expect(await eventsFor('impersonation.started', context.ids.pending)).toHaveLength(before)
  })

  it('refuses a second impersonation and security changes while impersonating', async () => {
    const jar = await signIn('admin')
    await start(jar, context.ids.user)

    expect((await reject(() => start(jar, context.ids.editor))).body?.code).toBeDefined()
    const blocked = await reject(() =>
      context.auth.api.changePassword({
        body: { currentPassword: PASSWORD, newPassword: 'Another-Password-2!' },
        headers: jar.headers(),
      })
    )
    expect(blocked.body?.code).toBe('NOT_ALLOWED_WHILE_IMPERSONATING')

    await stop(jar)
    expect(await currentUser(jar)).toBe(context.ids.admin)
  })

  it('does not treat a normal session as impersonated', async () => {
    const jar = await signIn('user')
    expect(await context.auth.api.getImpersonation({ headers: jar.headers() })).toBeNull()
    expect((await reject(() => stop(jar))).body?.code).toBe('NOT_IMPERSONATING')
    expect(await currentUser(jar)).toBe(context.ids.user)
  })

  it('ends the impersonated session after the expiry and still returns to the admin', async () => {
    const jar = await signIn('admin')
    const { sessionId } = await start(jar, context.ids.user)
    await context.client.db
      .update(context.schema.sessions)
      .set({ expiresAt: new Date(Date.now() - 60_000).toISOString() })
      .where(eq(context.schema.sessions.id, sessionId))

    for (const name of jar.cookies.keys()) {
      if (name.includes('session_data')) jar.cookies.delete(name)
    }
    expect(await context.auth.api.getImpersonation({ headers: jar.headers() })).toBeNull()
    expect(await currentUser(jar)).toBeUndefined()

    await stop(jar)
    expect(await currentUser(jar)).toBe(context.ids.admin)
  })

  it('does not let another signed in user reuse a stale admin cookie', async () => {
    const jar = await signIn('admin')
    await start(jar, context.ids.user)
    const adminCookie = [...jar.cookies].find(([name]) => name.includes('admin_session'))
    expect(adminCookie).toBeDefined()

    const other = await signIn('editor')
    if (adminCookie) other.cookies.set(adminCookie[0], adminCookie[1])
    expect((await reject(() => stop(other))).body?.code).toBe('NOT_IMPERSONATING')
    expect(await currentUser(other)).toBe(context.ids.editor)
    await stop(jar)
  })

  it('drops the admin cookie when the impersonated user signs out', async () => {
    const jar = await signIn('admin')
    await start(jar, context.ids.user)
    expect(jar.has('admin_session')).toBe(true)

    const result = await context.auth.api.signOut({ headers: jar.headers(), returnHeaders: true })
    jar.apply(result.headers)
    expect(jar.has('admin_session')).toBe(false)
    expect(await currentUser(jar)).toBeUndefined()
    expect((await reject(() => stop(jar))).body?.code).toBe('NOT_IMPERSONATING')
  })

  it('keeps the plugin endpoints closed over HTTP', async () => {
    const jar = await signIn('admin')
    const responses = await Promise.all(
      ['start', 'stop', 'current'].map(path =>
        context.auth.handler(
          new Request(`http://localhost:3000/api/auth/impersonation/${path}`, {
            body:
              path === 'current' ? undefined : JSON.stringify({ reason: 'A valid reason', userId: context.ids.user }),
            headers: new Headers({
              'content-type': 'application/json',
              cookie: jar.headers().get('cookie') ?? '',
              origin: 'http://localhost:3000',
            }),
            method: path === 'current' ? 'GET' : 'POST',
          })
        )
      )
    )
    expect(responses.map(response => response.status)).toEqual([404, 404, 404])
    expect(await currentUser(jar)).toBe(context.ids.admin)
  })
})
