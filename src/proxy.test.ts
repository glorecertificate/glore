import { type NextProxy, NextRequest } from 'next/server'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession } } }))

const run = async (path: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) => {
  const { proxy } = await import('@/proxy')
  return await proxy(new NextRequest(`https://glore.test${path}`, init), {} as Parameters<NextProxy>[1])
}

const location = (response: Awaited<ReturnType<typeof run>>) => {
  const header = response?.headers.get('location')
  return header ? new URL(header) : null
}

describe('proxy for guests', () => {
  beforeEach(() => {
    getSession.mockReset()
    getSession.mockResolvedValue(null)
  })

  it('sends a guest on a deep link to the login with the way back', async () => {
    const target = location(await run('/certificates/16911/review?tab=a'))

    expect(target?.pathname).toBe('/login')
    expect(target?.searchParams.get('next')).toBe('/certificates/16911/review?tab=a')
  })

  it('keeps the expired flag next to the way back', async () => {
    const target = location(await run('/courses', { headers: { cookie: 'gl.session_token=abc' } }))

    expect(target?.searchParams.get('expired')).toBe('true')
    expect(target?.searchParams.get('next')).toBe('/courses')
  })

  it('adds no way back for the home page and the dashboard', async () => {
    for (const path of ['/', '/dashboard']) {
      const target = location(await run(path))
      expect(target?.pathname).toBe('/login')
      expect(target?.searchParams.has('next')).toBe(false)
    }
  })

  it('adds no way back for requests that are not page loads', async () => {
    const target = location(await run('/certificates/16911/review', { method: 'POST' }))

    expect(target?.pathname).toBe('/login')
    expect(target?.searchParams.has('next')).toBe(false)
  })

  it('lets a guest reach the public pages', async () => {
    const response = await run('/verify/ABC123')

    expect(response?.headers.get('location')).toBeNull()
  })

  it('does not send a banned user back to a page they cannot use', async () => {
    getSession.mockResolvedValue({ user: { banned: true, onboardedAt: '2025-01-01' } })

    const target = location(await run('/certificates/16911/review'))

    expect(target?.pathname).toBe('/login')
    expect(target?.searchParams.has('next')).toBe(false)
  })
})
