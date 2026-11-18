import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  connection: vi.fn<() => Promise<void>>(),
  getSession: vi.fn(),
}))

vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('next/server', async importOriginal => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: mocks.connection,
}))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mocks.getSession } } }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
}))

const admin = { banned: false, id: 'admin-1', role: 'admin' }

describe('admin helpers', () => {
  let helpers: typeof import('@/actions/admin/helpers')

  beforeEach(async () => {
    mocks.connection.mockReset()
    mocks.getSession.mockReset()
    mocks.connection.mockResolvedValue()
    helpers = await import('@/actions/admin/helpers')
  })

  it('never reads the session before the request is known', async () => {
    let release = () => {}
    mocks.connection.mockReturnValue(new Promise<void>(resolve => (release = resolve)))
    mocks.getSession.mockResolvedValue({ user: admin })

    const pending = helpers.requireAdmin()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(mocks.getSession).not.toHaveBeenCalled()

    release()
    await expect(pending).resolves.toMatchObject({ id: 'admin-1' })
    expect(mocks.getSession).toHaveBeenCalledTimes(1)
  })

  it('reads the session without the cookie cache', async () => {
    mocks.getSession.mockResolvedValue({ user: admin })
    await helpers.requireAdmin()
    expect(mocks.getSession).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }))
  })

  it('rejects a banned or non admin user', async () => {
    mocks.getSession.mockResolvedValue({ user: { ...admin, banned: true } })
    await expect(helpers.requireAdmin()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    mocks.getSession.mockResolvedValue({ user: { ...admin, role: 'user' } })
    await expect(helpers.requireAdmin()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    mocks.getSession.mockResolvedValue(null)
    await expect(helpers.requireAdmin()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
