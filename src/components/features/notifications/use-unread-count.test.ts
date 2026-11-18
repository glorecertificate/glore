import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => ({
  subscribe: undefined as ((listener: () => void) => () => void) | undefined,
  getSnapshot: undefined as (() => number) | undefined,
}))

const countUnreadNotifications = vi.hoisted(() => vi.fn())

vi.mock('react', () => ({
  useSyncExternalStore: (subscribe: (listener: () => void) => () => void, getSnapshot: () => number) => {
    store.subscribe = subscribe
    store.getSnapshot = getSnapshot
    return getSnapshot()
  },
}))

vi.mock('@/actions/notifications/inbox', () => ({ countUnreadNotifications }))

const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
}

describe('use-unread-count', () => {
  beforeEach(() => {
    vi.resetModules()
    countUnreadNotifications.mockReset()
    vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }))
    vi.stubGlobal('window', new EventTarget())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mount = async () => {
    const { useUnreadCount: render } = await import('./use-unread-count')
    render()
    return store
  }

  it('clears the badge when the last subscriber leaves', async () => {
    countUnreadNotifications.mockResolvedValue({ data: 4 })
    const { subscribe, getSnapshot } = await mount()
    const unsubscribe = subscribe!(() => undefined)
    await flush()
    expect(getSnapshot!()).toBe(4)

    unsubscribe()

    expect(getSnapshot!()).toBe(0)
  })

  it('drops a response that arrives after the last subscriber left', async () => {
    let resolve: (value: { data: number }) => void = () => undefined
    countUnreadNotifications.mockReturnValue(new Promise(_resolve => (resolve = _resolve)))
    const { subscribe, getSnapshot } = await mount()
    const unsubscribe = subscribe!(() => undefined)
    unsubscribe()

    resolve({ data: 7 })
    await flush()

    expect(getSnapshot!()).toBe(0)
  })
})
