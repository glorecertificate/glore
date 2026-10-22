import { describe, expect, it } from 'vitest'

import { scrollEdgesMask } from '@/hooks/use-scroll-edges'

describe('scrollEdgesMask', () => {
  it('returns nothing when the content fits', () => {
    expect(scrollEdgesMask({ end: false, start: false })).toBeUndefined()
  })

  it('fades only the edge with hidden content', () => {
    expect(scrollEdgesMask({ end: true, start: false })).toBe(
      'linear-gradient(to right, #000, #000 1.5rem, #000 calc(100% - 1.5rem), transparent)'
    )
    expect(scrollEdgesMask({ end: false, start: true })).toBe(
      'linear-gradient(to right, transparent, #000 1.5rem, #000 calc(100% - 1.5rem), #000)'
    )
  })

  it('fades both edges in the middle of the strip', () => {
    expect(scrollEdgesMask({ end: true, start: true }, '1rem')).toBe(
      'linear-gradient(to right, transparent, #000 1rem, #000 calc(100% - 1rem), transparent)'
    )
  })
})
