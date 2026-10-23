import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const signInEmail = vi.hoisted(() =>
  vi.fn((_options: { body: { email: string; password: string }; headers?: Headers }) =>
    Promise.resolve({ user: { id: 'x', locale: 'it' as null | string } })
  )
)
const cookieJar = vi.hoisted(() => new Map<string, string>())

const hashPassword = vi.hoisted(() => vi.fn((_password: string) => Promise.resolve('hash')))

vi.mock('@/lib/auth', () => ({ auth: { api: { signInEmail } } }))
vi.mock('better-auth/crypto', async importOriginal => ({
  ...(await importOriginal<typeof import('better-auth/crypto')>()),
  hashPassword,
}))
vi.mock('@/lib/rate-limit', () => ({
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: () => Promise.resolve(false),
}))
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      delete: (name: string) => cookieJar.delete(name),
      get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
      set: (name: string, value: string) => cookieJar.set(name, value),
    }),
  headers: () => Promise.resolve(new Headers({ 'user-agent': 'Mozilla/5.0 Chrome/130.0 Safari/537.36' })),
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
  unstable_rethrow: () => undefined,
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const id = `login-${suffix}`
const email = `${id}@login.test`
const username = `ab${suffix.slice(0, 1)}`

describe.skipIf(!isLocalDatabase)('login by email or username', () => {
  let context: {
    actions: typeof import('@/actions/auth')
    client: typeof import('@/db/client')
    schema: typeof import('@/db/schema')
  }

  beforeAll(async () => {
    const [actions, client, schema] = await Promise.all([
      import('@/actions/auth'),
      import('@/db/client'),
      import('@/db/schema'),
    ])
    context = { actions, client, schema }
    await client.db.delete(schema.users).where(eq(schema.users.id, id))
    await client.db
      .insert(schema.users)
      .values({ email, emailVerified: true, firstName: 'Login', id, name: 'Login', username })
  })

  beforeEach(() => {
    signInEmail.mockClear()
    hashPassword.mockClear()
    cookieJar.clear()
  })

  afterAll(async () => {
    await context.client.db.delete(context.schema.users).where(eq(context.schema.users.id, id))
  })

  it('signs in with the email', async () => {
    await expect(context.actions.login({ password: 'Password1!', username: email })).rejects.toThrow(
      'REDIRECT:/dashboard'
    )
    expect(signInEmail.mock.calls[0]?.[0].body.email).toBe(email)
  })

  it('signs in with a username of three characters, in any case', async () => {
    expect(username).toHaveLength(3)
    await expect(
      context.actions.login({ password: 'Password1!', username: ` ${username.toUpperCase()} ` })
    ).rejects.toThrow('REDIRECT:/dashboard')
    expect(signInEmail.mock.calls[0]?.[0].body.email).toBe(email)
  })

  it('forwards the request headers so the session records the device', async () => {
    await expect(context.actions.login({ password: 'Password1!', username: email })).rejects.toThrow(
      'REDIRECT:/dashboard'
    )
    expect(signInEmail.mock.calls[0]?.[0].headers?.get('user-agent')).toContain('Chrome')
  })

  it('answers an unknown user like a wrong password', async () => {
    const result = await context.actions.login({ password: 'Password1!', username: 'nobody-here' })
    expect(result).toEqual({ error: { code: 'AUTH_ERROR', message: 'Login failed' } })
    expect(signInEmail).not.toHaveBeenCalled()
  })

  it('hashes the password for an unknown user so the answer takes as long as a wrong password', async () => {
    await context.actions.login({ password: 'Password1!', username: 'nobody-here' })
    expect(hashPassword).toHaveBeenCalledWith('Password1!')
  })

  it('switches the interface to the language stored on the account', async () => {
    cookieJar.set('NEXT_LOCALE', 'en')

    await expect(context.actions.login({ password: 'Password1!', username: email })).rejects.toThrow(
      'REDIRECT:/dashboard'
    )

    expect(cookieJar.get('NEXT_LOCALE')).toBe('it')
  })

  it('sets the language cookie in a fresh browser too', async () => {
    await expect(context.actions.login({ password: 'Password1!', username: email })).rejects.toThrow(
      'REDIRECT:/dashboard'
    )

    expect(cookieJar.get('NEXT_LOCALE')).toBe('it')
  })

  it('keeps the browser language when the account has none or an unknown one', async () => {
    cookieJar.set('NEXT_LOCALE', 'es')

    for (const locale of [null, 'xx']) {
      signInEmail.mockResolvedValueOnce({ user: { id: 'x', locale } })
      await expect(context.actions.login({ password: 'Password1!', username: email })).rejects.toThrow(
        'REDIRECT:/dashboard'
      )
    }

    expect(cookieJar.get('NEXT_LOCALE')).toBe('es')
  })

  it('leaves the language alone when the sign-in fails', async () => {
    signInEmail.mockRejectedValueOnce(new Error('INVALID_EMAIL_OR_PASSWORD'))

    const result = await context.actions.login({ password: 'wrong', username: email })

    expect(result).toEqual({ error: { code: 'AUTH_ERROR', message: 'Login failed' } })
    expect(cookieJar.has('NEXT_LOCALE')).toBe(false)
  })

  it('returns to the page the visitor came from', async () => {
    await expect(
      context.actions.login({ next: '/certificates/16911/review?tab=a', password: 'Password1!', username: email })
    ).rejects.toThrow('REDIRECT:/certificates/16911/review?tab=a')
  })

  it('ignores a return address that leaves the site or points at the sign-in', async () => {
    for (const next of ['//evil.example', 'https://evil.example', '/login', '/api/auth/sign-out', '/\\evil.example']) {
      await expect(context.actions.login({ next, password: 'Password1!', username: email })).rejects.toThrow(
        'REDIRECT:/dashboard'
      )
    }
  })

  it('leaves hashing to the sign-in for a known user', async () => {
    await expect(context.actions.login({ password: 'Password1!', username: email })).rejects.toThrow(
      'REDIRECT:/dashboard'
    )
    expect(hashPassword).not.toHaveBeenCalled()
  })
})
