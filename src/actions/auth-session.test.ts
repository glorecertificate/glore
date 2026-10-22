import { describe, expect, it, vi } from 'vitest'

const getSession = vi.hoisted(() =>
  vi.fn((_options: { headers: Headers; query?: { disableCookieCache?: boolean } }) =>
    Promise.resolve<{ user: { id: string } } | null>(null)
  )
)

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession } } }))
vi.mock('@/db/client', () => ({ db: {} }))
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({ clientAddress: vi.fn(), isRateLimited: vi.fn() }))
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: () => undefined }))

describe('getAuthUser', () => {
  it('reads the session from the database, not the cookie cache', async () => {
    const { getAuthUser } = await import('@/actions/auth')

    expect(await getAuthUser()).toBeNull()
    expect(getSession).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }))
  })
})
