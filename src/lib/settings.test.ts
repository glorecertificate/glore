import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import { loadSettings } from '@/lib/settings'

const state = vi.hoisted(() => ({
  failure: null as Error | null,
  rows: [] as { key: string; value: unknown }[],
}))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => (state.failure ? Promise.reject(state.failure) : Promise.resolve(state.rows)),
    }),
  },
}))

describe('loadSettings', () => {
  beforeEach(() => {
    state.failure = null
    state.rows = []
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('returns the defaults when nothing is stored', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('layers stored values over the defaults', async () => {
    state.rows = [{ key: 'email', value: 'team@example.org' }]
    expect(await loadSettings()).toEqual({ ...DEFAULT_SETTINGS, email: 'team@example.org' })
  })

  it('skips an invalid stored value', async () => {
    state.rows = [{ key: 'email', value: 'broken' }]
    expect(await loadSettings({ cache: false })).toEqual(DEFAULT_SETTINGS)
  })

  it('falls back to the defaults when the database fails', async () => {
    state.failure = new Error('connection refused')
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(console.error).toHaveBeenCalled()
  })
})
