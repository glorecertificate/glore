import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminFixture, isLocalDatabase } from '@/actions/admin/test-harness'
import { type Jar } from '@/lib/test-jar'

const current = vi.hoisted(() => ({ jar: null as null | { headers: () => Headers } }))
const sent = vi.hoisted(() => [] as { template: { name: string; props: { url?: string } }; to: string }[])
const limiter = vi.hoisted(() => ({ limited: new Set<string>(), keys: [] as string[] }))
const deferred = vi.hoisted(() => [] as (() => Promise<void> | void)[])

vi.mock('next/headers', async importOriginal => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  headers: () => Promise.resolve(current.jar?.headers() ?? new Headers()),
}))
vi.mock('next/server', async importOriginal => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => Promise<void> | void) => {
    deferred.push(task)
  },
  connection: () => Promise.resolve(),
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: (key: string) => {
    limiter.keys.push(key)
    return Promise.resolve(limiter.limited.has(key))
  },
}))
vi.mock('@/lib/email', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/email')>()),
  sendMail: (options: (typeof sent)[number]) => {
    sent.push(options)
    return Promise.resolve()
  },
}))

const PASSWORD = 'Password1!'
const KEYS = ['changer', 'limited', 'resetter', 'wrong'] as const

describe.skipIf(!isLocalDatabase)('password and session security', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let actions: typeof import('@/actions/auth')

  const as = (jar: Jar | null) => {
    current.jar = jar
  }

  const sessionIds = async (userId: string) =>
    (
      await fixture.client.db.query.sessions.findMany({
        columns: { id: true },
        where: eq(fixture.schema.sessions.userId, userId),
      })
    ).map(row => row.id)

  const flush = async () => {
    const tasks = deferred.splice(0)
    await Promise.all(tasks.map(task => task()))
  }

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS)
    actions = await import('@/actions/auth')
  }, 60_000)

  beforeEach(() => {
    sent.length = 0
    limiter.limited.clear()
    limiter.keys.length = 0
    deferred.length = 0
    as(null)
  })

  afterAll(async () => {
    as(null)
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  it('revokes every other session when the password changes', async () => {
    const jar = await fixture.signIn('changer')
    await fixture.signIn('changer')
    const before = await sessionIds(fixture.ids.changer)
    expect(before.length).toBeGreaterThanOrEqual(2)

    as(jar)
    const result = await actions.changePassword(PASSWORD, 'Password2!')
    expect(result.error).toBeUndefined()

    const after = await sessionIds(fixture.ids.changer)
    expect(after).toHaveLength(1)
    expect(before).not.toContain(after[0])
  })

  it('limits password changes per user before any hashing or mail', async () => {
    as(await fixture.signIn('limited'))
    limiter.limited.add(`change-password:${fixture.ids.limited}`)

    const result = await actions.changePassword(PASSWORD, 'Password4!')

    expect(result).toEqual({ error: { code: 'RATE_LIMITED', message: 'Too many attempts' } })
    expect(sent).toHaveLength(0)
    await expect(
      fixture.auth.api.signInEmail({ body: { email: fixture.emails.limited, password: PASSWORD } })
    ).resolves.toBeDefined()
  })

  it('sends the recovery mail after the response so known and unknown users answer alike', async () => {
    const requested = await actions.resetPassword(fixture.emails.resetter)
    expect(requested.error).toBeNull()
    expect(sent).toHaveLength(0)

    await flush()
    expect(sent.map(mail => mail.template.name)).toEqual(['auth/recovery'])
  })

  it('does not defer anything for an unknown user', async () => {
    const requested = await actions.resetPassword(`nobody-${fixture.suffix}@admin-lane.test`)
    expect(requested.error).toBeNull()
    expect(deferred).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('answers a bad reset token with an app code and a fixed message', async () => {
    const result = await actions.updatePassword('not-a-real-token', 'Password3!')

    expect(result).toEqual({ data: null, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired link' } })
  })

  it('answers a password the library rejects with an input code', async () => {
    await actions.resetPassword(fixture.emails.resetter)
    await flush()
    const url = sent.find(mail => mail.template.name === 'auth/recovery')?.template.props.url
    const token = url ? new URL(url).pathname.split('/').pop() : undefined

    const result = await actions.updatePassword(token ?? '', 'short')

    expect(result).toEqual({
      data: null,
      error: { code: 'INVALID_INPUT', message: 'Password does not meet the requirements' },
    })
  })

  it('answers a wrong current password with its own code and no library text', async () => {
    as(await fixture.signIn('wrong'))

    const result = await actions.changePassword('Wrong-password1!', 'Password5!')

    expect(result).toEqual({ error: { code: 'INVALID_PASSWORD', message: 'Invalid current password' } })
  })

  it('revokes every session when the password is reset', async () => {
    await fixture.signIn('resetter')
    await fixture.signIn('resetter')
    expect((await sessionIds(fixture.ids.resetter)).length).toBeGreaterThanOrEqual(2)

    const requested = await actions.resetPassword(fixture.emails.resetter)
    expect(requested.error).toBeNull()
    await flush()
    const url = sent.find(mail => mail.template.name === 'auth/recovery')?.template.props.url
    const token = url ? new URL(url).pathname.split('/').pop() : undefined
    expect(token).toBeTruthy()

    const updated = await actions.updatePassword(token ?? '', 'Password3!')
    expect(updated.error).toBeNull()

    expect(await sessionIds(fixture.ids.resetter)).toHaveLength(0)
  })
})
