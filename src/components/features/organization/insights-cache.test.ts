import { describe, expect, it, vi } from 'vitest'

import { INSIGHTS_FRESH_MS, createInsightsCache } from './insights-cache'

const setup = () => {
  let clock = 1_000
  const load = vi.fn((organizationId: number) => Promise.resolve<{ organizationId: number } | null>({ organizationId }))
  const cache = createInsightsCache(load, () => clock)
  return { advance: (ms: number) => (clock += ms), cache, load }
}

describe('insights cache', () => {
  it('returns the entry for the same user and organization', async () => {
    const { cache } = setup()
    await cache.prefetch({ organizationId: 1, userId: 'a' })
    expect(cache.read({ organizationId: 1, userId: 'a' })).toEqual({ organizationId: 1 })
  })

  it('drops the entry on invalidate', async () => {
    const { cache } = setup()
    await cache.prefetch({ organizationId: 1, userId: 'a' })
    cache.invalidate()
    expect(cache.read({ organizationId: 1, userId: 'a' })).toBeNull()
  })

  it('never returns an entry of organization A for organization B', async () => {
    const { cache } = setup()
    await cache.prefetch({ organizationId: 1, userId: 'a' })
    expect(cache.read({ organizationId: 2, userId: 'a' })).toBeNull()
  })

  it('never returns an entry of user A for user B', async () => {
    const { cache } = setup()
    await cache.prefetch({ organizationId: 1, userId: 'a' })
    expect(cache.read({ organizationId: 1, userId: 'b' })).toBeNull()
  })

  it('fetches again for another scope instead of reusing the pending entry', async () => {
    const { cache, load } = setup()
    await cache.prefetch({ organizationId: 1, userId: 'a' })
    await cache.prefetch({ organizationId: 2, userId: 'a' })
    await cache.prefetch({ organizationId: 2, userId: 'b' })
    expect(load).toHaveBeenCalledTimes(3)
    expect(cache.read({ organizationId: 1, userId: 'a' })).toBeNull()
  })

  it('expires after the fresh window', async () => {
    const { advance, cache } = setup()
    await cache.prefetch({ organizationId: 1, userId: 'a' })
    advance(INSIGHTS_FRESH_MS + 1)
    expect(cache.read({ organizationId: 1, userId: 'a' })).toBeNull()
  })

  it('shares one in-flight fetch and refetches after a failed one', async () => {
    const { cache, load } = setup()
    const scope = { organizationId: 1, userId: 'a' }
    await Promise.all([cache.prefetch(scope), cache.prefetch(scope)])
    expect(load).toHaveBeenCalledTimes(1)
    load.mockResolvedValueOnce(null)
    await cache.prefetch({ organizationId: 2, userId: 'a' })
    await cache.prefetch({ organizationId: 2, userId: 'a' })
    expect(load).toHaveBeenCalledTimes(3)
  })
})
