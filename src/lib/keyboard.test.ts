import { describe, expect, it } from 'vitest'

import { modifierKeyFor } from '@/lib/keyboard'

describe('modifierKeyFor', () => {
  it('shows the command key on Apple systems', () => {
    expect(modifierKeyFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15')).toBe(
      '⌘'
    )
    expect(modifierKeyFor('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1')).toBe('⌘')
  })

  it('shows Ctrl on other systems and when the agent is unknown', () => {
    expect(
      modifierKeyFor('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36')
    ).toBe('Ctrl')
    expect(modifierKeyFor('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36')).toBe('Ctrl')
    expect(modifierKeyFor(null)).toBe('Ctrl')
  })
})
