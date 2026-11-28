import { describe, expect, it } from 'vitest'

import { START_SLOP, dragIntent, shouldDismiss } from '@/lib/drag-dismiss'

describe('dragIntent', () => {
  it('waits until the finger moves past the slop', () => {
    expect(dragIntent(0, 0)).toBe('pending')
    expect(dragIntent(START_SLOP - 1, START_SLOP - 1)).toBe('pending')
  })

  it('starts a drag for a downward move', () => {
    expect(dragIntent(0, START_SLOP)).toBe('drag')
    expect(dragIntent(4, 20)).toBe('drag')
  })

  it('cancels an upward or mostly sideways move', () => {
    expect(dragIntent(0, -START_SLOP)).toBe('cancel')
    expect(dragIntent(20, 10)).toBe('cancel')
    expect(dragIntent(-20, 10)).toBe('cancel')
  })
})

describe('shouldDismiss', () => {
  it('dismisses past a quarter of the sheet height', () => {
    expect(shouldDismiss({ delta: 101, elapsed: 1000, height: 400 })).toBe(true)
    expect(shouldDismiss({ delta: 99, elapsed: 1000, height: 400 })).toBe(false)
  })

  it('dismisses a fast flick below the distance threshold', () => {
    expect(shouldDismiss({ delta: 60, elapsed: 100, height: 800 })).toBe(true)
    expect(shouldDismiss({ delta: 60, elapsed: 400, height: 800 })).toBe(false)
  })

  it('never divides by zero for an instant release', () => {
    expect(shouldDismiss({ delta: 0, elapsed: 0, height: 400 })).toBe(false)
  })
})
