import { describe, expect, it } from 'vitest'

import { SHORTCUTS, matchesShortcut } from '@/lib/shortcuts'

const press = (init: Partial<KeyboardEvent>) =>
  ({
    altKey: false,
    ctrlKey: false,
    isComposing: false,
    metaKey: false,
    shiftKey: false,
    target: null,
    ...init,
  }) as KeyboardEvent

const field = { isContentEditable: false, tagName: 'INPUT' } as unknown as EventTarget

describe('matchesShortcut', () => {
  it('matches a modifier shortcut with Meta or Control', () => {
    expect(matchesShortcut(press({ key: 'k', metaKey: true }), SHORTCUTS.search)).toBe(true)
    expect(matchesShortcut(press({ ctrlKey: true, key: 'K' }), SHORTCUTS.search)).toBe(true)
  })

  it('rejects a modifier shortcut without the modifier or with Shift or Alt', () => {
    expect(matchesShortcut(press({ key: 'k' }), SHORTCUTS.search)).toBe(false)
    expect(matchesShortcut(press({ key: 'K', metaKey: true, shiftKey: true }), SHORTCUTS.search)).toBe(false)
    expect(matchesShortcut(press({ altKey: true, key: 'k', metaKey: true }), SHORTCUTS.search)).toBe(false)
  })

  it('runs a modifier shortcut from inside a field', () => {
    expect(matchesShortcut(press({ key: '\\', metaKey: true, target: field }), SHORTCUTS.sidebar)).toBe(true)
  })

  it('ignores a single-key shortcut while typing in a field', () => {
    expect(matchesShortcut(press({ key: '/' }), SHORTCUTS.filter)).toBe(true)
    expect(matchesShortcut(press({ key: '/', target: field }), SHORTCUTS.filter)).toBe(false)
    expect(matchesShortcut(press({ key: '/', metaKey: true }), SHORTCUTS.filter)).toBe(false)
  })

  it('ignores keys during text composition', () => {
    expect(matchesShortcut(press({ isComposing: true, key: 'k', metaKey: true }), SHORTCUTS.search)).toBe(false)
  })
})
