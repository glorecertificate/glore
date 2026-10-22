import { beforeEach, describe, expect, it, vi } from 'vitest'

const order: string[] = []

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('next/server', () => ({
  connection: vi.fn(() => {
    order.push('connection')
    return Promise.resolve()
  }),
}))
vi.mock('@/db/client', () => {
  const returning = vi.fn(() => {
    order.push('query')
    return Promise.resolve([{ count: 1 }])
  })
  const onConflictDoUpdate = vi.fn(() => ({ returning }))
  const values = vi.fn(() => ({ onConflictDoUpdate }))
  return { db: { insert: vi.fn(() => ({ values })) } }
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    order.length = 0
  })

  it('defers to request time before reading the clock', async () => {
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      order.push('now')
      return 1
    })
    const { checkRateLimit } = await import('@/lib/rate-limit')

    const result = await checkRateLimit('key', 5, 1000)

    expect(order.slice(0, 2)).toEqual(['connection', 'now'])
    expect(result).toEqual({ limited: false, remaining: 4 })
    now.mockRestore()
  })
})
