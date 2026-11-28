import { afterEach, describe, expect, it, vi } from 'vitest'

import { leavesPage, navigationProgress } from '@/lib/navigation-progress'

const click = { altKey: false, button: 0, ctrlKey: false, metaKey: false, shiftKey: false }
const current = { href: 'https://glore.localhost/courses?sort=name', pathname: '/courses' }
const link = (href: string, extra: Partial<{ download: boolean; target: string }> = {}) => ({
  download: false,
  href,
  target: '',
  ...extra,
})

describe('leavesPage', () => {
  it('starts for a plain click on a link to another page of the app', () => {
    expect(leavesPage(click, link('/certificates'), current)).toBe(true)
    expect(leavesPage(click, link('https://glore.localhost/docs'), current)).toBe(true)
  })

  it('skips links that stay on the page, leave the app, or open elsewhere', () => {
    expect(leavesPage(click, link('/courses?sort=date'), current)).toBe(false)
    expect(leavesPage(click, link('https://example.com/courses'), current)).toBe(false)
    expect(leavesPage(click, link('/docs', { target: '_blank' }), current)).toBe(false)
    expect(leavesPage(click, link('/docs', { download: true }), current)).toBe(false)
    expect(leavesPage({ ...click, metaKey: true }, link('/docs'), current)).toBe(false)
    expect(leavesPage({ ...click, button: 1 }, link('/docs'), current)).toBe(false)
  })
})

describe('navigationProgress', () => {
  afterEach(() => {
    navigationProgress.commit()
    vi.useRealTimers()
  })

  it('stays active while a route fallback holds it', () => {
    const release = navigationProgress.hold()
    expect(navigationProgress.active()).toBe(true)
    release()
    expect(navigationProgress.active()).toBe(false)
  })

  it('ends a click intent on commit and reports the commit', () => {
    const events: string[] = []
    const unsubscribe = navigationProgress.subscribe(event => events.push(event))
    navigationProgress.begin()
    expect(navigationProgress.active()).toBe(true)
    navigationProgress.commit()
    expect(navigationProgress.active()).toBe(false)
    expect(events).toEqual(['change', 'commit'])
    unsubscribe()
  })

  it('drops a click intent that never commits', () => {
    vi.useFakeTimers()
    navigationProgress.begin()
    vi.advanceTimersByTime(8000)
    expect(navigationProgress.active()).toBe(false)
  })
})
