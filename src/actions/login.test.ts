import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const signInEmail = vi.hoisted(() =>
  vi.fn((_options: { body: { email: string; password: string } }) => Promise.resolve({ user: { id: 'x' } }))
)

vi.mock('@/lib/auth', () => ({ auth: { api: { signInEmail } } }))
vi.mock('@/lib/rate-limit', () => ({
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: () => Promise.resolve(false),
}))
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
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

  it('answers an unknown user like a wrong password', async () => {
    const result = await context.actions.login({ password: 'Password1!', username: 'nobody-here' })
    expect(result).toEqual({ error: { code: 'AUTH_ERROR', message: 'Login failed' } })
    expect(signInEmail).not.toHaveBeenCalled()
  })
})
