import { afterEach, describe, expect, it, vi } from 'vitest'

import { NOTIFICATIONS_CHANGED, announceNotificationsChanged } from './events'

describe('announceNotificationsChanged', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tells listeners that the unread count changed', () => {
    const target = new EventTarget()
    vi.stubGlobal('window', target)
    const listener = vi.fn()
    target.addEventListener(NOTIFICATIONS_CHANGED, listener)

    announceNotificationsChanged()

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does nothing outside the browser', () => {
    expect(() => announceNotificationsChanged()).not.toThrow()
  })
})
