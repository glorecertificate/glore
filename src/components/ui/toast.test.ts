import { afterEach, describe, expect, it, vi } from 'vitest'

import { TOAST_DURATIONS, toast } from '@/components/ui/toast'

const sonner = vi.hoisted(() =>
  Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() })
)

vi.mock('sonner', () => ({ toast: sonner }))

describe('toast', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps each type on screen for its own duration', () => {
    for (const type of ['error', 'info', 'success', 'warning'] as const) {
      toast[type]('Saved')
      expect(sonner[type]).toHaveBeenCalledWith('Saved', { duration: TOAST_DURATIONS[type] })
    }
  })

  it('keeps errors on screen longer than confirmations', () => {
    expect(TOAST_DURATIONS.error).toBeGreaterThan(TOAST_DURATIONS.warning)
    expect(TOAST_DURATIONS.warning).toBeGreaterThan(TOAST_DURATIONS.success)
  })

  it('lets the caller override the duration and pass other options', () => {
    toast.error('Failed', { description: 'Try again', duration: 1000 })
    expect(sonner.error).toHaveBeenCalledWith('Failed', { description: 'Try again', duration: 1000 })
  })

  it('passes a plain toast through unchanged', () => {
    toast('Install the app', { duration: Number.POSITIVE_INFINITY, id: 'install' })
    expect(sonner).toHaveBeenCalledWith('Install the app', { duration: Number.POSITIVE_INFINITY, id: 'install' })
  })
})
