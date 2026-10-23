import { afterEach, describe, expect, it, vi } from 'vitest'

import { type PendingChange, commitPending } from '@/components/features/courses/course-editor/pending-change'

const setup = () => {
  const commit = vi.fn()
  const pendingRef: { current: PendingChange<string> | null } = { current: null }
  const timerRef: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined }
  const schedule = (value: string) => {
    clearTimeout(timerRef.current)
    pendingRef.current = { commit, value }
    timerRef.current = setTimeout(() => commitPending(pendingRef, timerRef), 500)
  }
  return { commit, pendingRef, schedule, timerRef }
}

describe('commitPending', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('commits the pending value when the debounce elapses', () => {
    vi.useFakeTimers()
    const { commit, schedule } = setup()
    schedule('a')
    vi.advanceTimersByTime(500)
    expect(commit).toHaveBeenCalledExactlyOnceWith('a')
  })

  it('commits immediately on flush and cancels the timer, so a lesson switch keeps the edit', () => {
    vi.useFakeTimers()
    const { commit, pendingRef, schedule, timerRef } = setup()
    schedule('a')
    vi.advanceTimersByTime(200)
    expect(commitPending(pendingRef, timerRef)).toBe('a')
    expect(commit).toHaveBeenCalledExactlyOnceWith('a')
    vi.advanceTimersByTime(1000)
    expect(commit).toHaveBeenCalledOnce()
  })

  it('returns null when nothing is pending', () => {
    const { commit, pendingRef, timerRef } = setup()
    expect(commitPending(pendingRef, timerRef)).toBeNull()
    expect(commit).not.toHaveBeenCalled()
  })
})
