import { afterEach, describe, expect, it, vi } from 'vitest'

import { finePointer, focusRootOnTouch } from '@/lib/pointer'

const stubPointer = (fine: boolean) =>
  vi.stubGlobal('window', { matchMedia: (query: string) => ({ matches: query === '(pointer: fine)' && fine }) })

const focusEvent = () => {
  const focus = vi.fn()
  const preventDefault = vi.fn()
  return { event: { currentTarget: { focus }, preventDefault } as unknown as Event, focus, preventDefault }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('finePointer', () => {
  it('answers false on the server', () => {
    expect(finePointer()).toBe(false)
  })

  it('follows the pointer media query', () => {
    stubPointer(true)
    expect(finePointer()).toBe(true)
    stubPointer(false)
    expect(finePointer()).toBe(false)
  })
})

describe('focusRootOnTouch', () => {
  it('leaves the default focus on a fine pointer', () => {
    stubPointer(true)
    const { event, focus, preventDefault } = focusEvent()
    expect(focusRootOnTouch(event)).toBe(false)
    expect(preventDefault).not.toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalled()
  })

  it('focuses the content root without scrolling on touch', () => {
    stubPointer(false)
    const { event, focus, preventDefault } = focusEvent()
    expect(focusRootOnTouch(event)).toBe(true)
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })
})
