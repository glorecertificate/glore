import { APIError } from 'better-auth/api'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/db/client', () => ({ db: {} }))
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }))

const loadAuth = async () => {
  vi.stubEnv('APP_URL', 'http://localhost:3000')
  vi.stubEnv('BETTER_AUTH_SECRET', 'lane-x-test-secret-with-enough-entropy-0123456789')
  const { auth } = await import('@/lib/auth')
  return auth
}

const endpointPaths = (auth: Awaited<ReturnType<typeof loadAuth>>) =>
  new Set(
    Object.values(auth.api as unknown as Record<string, { path?: string }>)
      .map(endpoint => endpoint.path)
      .filter((path): path is string => Boolean(path))
  )

describe('auth hardening', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keys every rate limit rule by a real endpoint path', async () => {
    const auth = await loadAuth()
    const paths = endpointPaths(auth)
    const keys = Object.keys(auth.options.rateLimit?.customRules ?? {})

    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) {
      expect(key.startsWith('/api/'), `${key} must not carry the base path`).toBe(false)
      expect(paths.has(key), `${key} is not a Better Auth endpoint`).toBe(true)
    }
  })

  it('limits the password reset request and the reset', async () => {
    const auth = await loadAuth()
    const rules = auth.options.rateLimit?.customRules ?? {}

    expect(rules).toHaveProperty('/request-password-reset')
    expect(rules).toHaveProperty('/reset-password')
    expect(rules).toHaveProperty('/change-password')
  })

  it('keeps every disabled path on a real endpoint', async () => {
    const auth = await loadAuth()
    const paths = endpointPaths(auth)

    for (const path of auth.options.disabledPaths ?? []) {
      expect(paths.has(path), `${path} is not a Better Auth endpoint`).toBe(true)
    }
  })

  it('closes the HTTP sign-in endpoints that skip the per-identifier limit', async () => {
    const auth = await loadAuth()

    for (const path of ['/sign-in/email', '/sign-in/username']) {
      const response = await auth.handler(
        new Request(`http://localhost:3000/api/auth${path}`, {
          body: JSON.stringify({ password: 'Password1!', username: 'someone', email: 'someone@example.com' }),
          headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
          method: 'POST',
        })
      )
      expect(response.status, path).toBe(404)
    }
  })

  it('refuses a password that breaks the rule on every password endpoint', async () => {
    const auth = await loadAuth()
    const paths = endpointPaths(auth)
    const calls = {
      '/change-password': (newPassword: string) =>
        auth.api.changePassword({ body: { currentPassword: 'Password1!', newPassword } }),
      '/reset-password': (newPassword: string) => auth.api.resetPassword({ body: { newPassword, token: 'token' } }),
    }

    for (const [path, call] of Object.entries(calls)) {
      expect(paths.has(path), `${path} is not a Better Auth endpoint`).toBe(true)
      for (const newPassword of ['password1', 'PASSWORD1!', 'Passwordabc!', 'Password!!!!']) {
        let failure: unknown = null
        try {
          await call(newPassword)
        } catch (e) {
          failure = e
        }
        expect(failure, `${path} ${newPassword}`).toBeInstanceOf(APIError)
        expect((failure as APIError).body?.code, `${path} ${newPassword}`).toBe('PASSWORD_TOO_WEAK')
      }
    }
  })
})
