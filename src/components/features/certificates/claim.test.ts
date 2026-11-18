import { describe, expect, it } from 'vitest'

import { failedClaims } from '@/components/features/certificates/claim'

describe('claim', () => {
  it('returns no failed id when every claim succeeds', async () => {
    expect(await failedClaims([1, 2, 3], () => Promise.resolve({}))).toEqual([])
  })

  it('returns the ids whose result carries an error', async () => {
    const assign = (id: number) => Promise.resolve(id === 2 ? { error: { code: 'FORBIDDEN' } } : {})
    expect(await failedClaims([1, 2, 3], assign)).toEqual([2])
  })

  it('returns the ids whose call rejects and still settles the others', async () => {
    const settled: number[] = []
    const assign = (id: number) => {
      if (id === 2) return Promise.reject(new Error('network'))
      settled.push(id)
      return Promise.resolve({})
    }
    expect(await failedClaims([1, 2, 3], assign)).toEqual([2])
    expect(settled).toEqual([1, 3])
  })

  it('treats every rejected call as failed', async () => {
    expect(await failedClaims([4, 5], () => Promise.reject(new Error('down')))).toEqual([4, 5])
  })
})
