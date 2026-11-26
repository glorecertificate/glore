import { NextRequest } from 'next/server'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ session: { current: null as Record<string, unknown> | null } }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: () => Promise.resolve(mocks.session.current) } } }))

const { proxy } = await import('@/proxy')

const request = (path: string) =>
  new NextRequest(`http://app.test${path}`, { headers: { cookie: 'glore.session_token=abc' } })

describe('proxy session redirects', () => {
  beforeEach(() => {
    mocks.session.current = null
  })

  it('sends a banned session through the session route with a safe return path', async () => {
    mocks.session.current = { user: { banned: true, id: 'u1', onboardedAt: 'x' } }
    const response = await proxy(request('/certificates?tab=pool'), {} as never)
    const location = new URL(response?.headers.get('location') ?? '', 'http://app.test')
    expect(location.pathname).toBe('/api/v1/session')
    expect(location.searchParams.get('next')).toBe('/certificates?tab=pool')
  })

  it('never lets a banned session loop on the login page', async () => {
    mocks.session.current = { user: { banned: true, id: 'u1', onboardedAt: 'x' } }
    const response = await proxy(request('/login'), {} as never)
    expect(new URL(response?.headers.get('location') ?? '', 'http://app.test').pathname).toBe('/api/v1/session')
  })

  it('sends a signed-in visit to the login page to its safe next path', async () => {
    mocks.session.current = { user: { id: 'u1', onboardedAt: 'x' } }
    const response = await proxy(request('/login?next=%2Fcertificates%3Ftab%3Dpool'), {} as never)
    const location = new URL(response?.headers.get('location') ?? '', 'http://app.test')
    expect(location.pathname).toBe('/certificates')
    expect(location.search).toBe('?tab=pool')
  })

  it('ignores an unsafe next path on a signed-in visit to the login page', async () => {
    mocks.session.current = { user: { id: 'u1', onboardedAt: 'x' } }
    for (const next of ['https://evil.test', '//evil.test', '/login', '/api/v1/session', '%5Cevil']) {
      const response = await proxy(request(`/login?next=${encodeURIComponent(next)}`), {} as never)
      const location = new URL(response?.headers.get('location') ?? '', 'http://app.test')
      expect(location.origin, next).toBe('http://app.test')
      expect(location.pathname, next).toBe('/dashboard')
    }
  })

  it('sends a signed-in visit to the login page without next to the dashboard', async () => {
    mocks.session.current = { user: { id: 'u1', onboardedAt: 'x' } }
    const response = await proxy(request('/login'), {} as never)
    expect(new URL(response?.headers.get('location') ?? '', 'http://app.test').pathname).toBe('/dashboard')
  })
})

describe('proxy locale param', () => {
  const visit = (path: string, cookie = '') =>
    proxy(new NextRequest(`http://app.test${path}`, { headers: { cookie } }), {} as never)

  beforeEach(() => {
    mocks.session.current = null
  })

  it('renders an invitation in its language and keeps it when the browser has no locale cookie', async () => {
    const response = await visit('/invite/tok?lang=it')
    expect(response?.headers.get('set-cookie')).toContain('NEXT_LOCALE=it')
    expect(response?.headers.get('x-middleware-request-cookie')).toContain('NEXT_LOCALE=it')
  })

  it('keeps the locale cookie that the browser already has', async () => {
    const response = await visit('/invite/tok?lang=it', 'NEXT_LOCALE=es')
    expect(response?.headers.get('set-cookie') ?? '').not.toContain('NEXT_LOCALE')
    expect(response?.headers.get('x-middleware-request-cookie') ?? '').not.toContain('NEXT_LOCALE=it')
  })

  it('ignores a locale that the app does not support', async () => {
    const response = await visit('/invite/tok?lang=xx')
    expect(response?.headers.get('set-cookie') ?? '').not.toContain('NEXT_LOCALE')
    expect(response?.headers.get('x-middleware-request-cookie') ?? '').not.toContain('NEXT_LOCALE')
  })
})
