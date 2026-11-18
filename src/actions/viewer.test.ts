import { redirect } from 'next/navigation'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadAdminOverview } from '@/actions/admin/overview-core'
import { loadTranslationsData } from '@/actions/translations-core'
import { getViewer } from '@/actions/viewer'

const mocks = vi.hoisted(() => ({
  row: {
    id: 'u1',
    isAdmin: true,
    isEditor: true,
    canEdit: true,
    memberships: [],
    organizations: [],
    role: 'admin',
  },
  session: { current: null as Record<string, unknown> | null },
}))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))
vi.mock('@/actions/cookies', () => ({ getCookie: () => Promise.resolve(null) }))
vi.mock('@/actions/session', () => ({ getSessionUser: () => Promise.resolve(mocks.session.current) }))
vi.mock('@/db/helpers', () => ({ safeQuery: () => Promise.resolve({ data: mocks.row, error: null }) }))

describe('viewer access', () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear()
    mocks.session.current = { banned: false, id: 'u1', isEditor: false, role: 'user' }
  })

  it('takes role and editor access from the session, not from the cached row', async () => {
    const viewer = await getViewer()
    expect(viewer).toMatchObject({ canEdit: false, isAdmin: false, isEditor: false, role: 'user' })
  })

  it('grants editor access from the session', async () => {
    mocks.session.current = { banned: false, id: 'u1', isEditor: true, role: 'user' }
    expect(await getViewer()).toMatchObject({ canEdit: true, isAdmin: false })
  })

  it('sends a banned session to the session route', async () => {
    mocks.session.current = { banned: true, id: 'u1', isEditor: true, role: 'admin' }
    await expect(getViewer()).rejects.toThrow('redirect:/api/v1/session')
  })

  it('denies the admin overview and the translations to a demoted session', async () => {
    expect(await loadAdminOverview()).toBeNull()
    expect(await loadTranslationsData()).toBeNull()
  })
})
