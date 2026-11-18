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
})
