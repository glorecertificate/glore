import { describe, expect, it } from 'vitest'

import { USERNAME_REGEX } from '@/lib/constants'
import { isReservedUsername, pickUsername, usernameBase } from '@/lib/username'

describe('usernameBase', () => {
  it('joins the names with a dot', () => {
    expect(usernameBase('Jane', 'Doe')).toBe('jane.doe')
  })

  it('strips accents, spaces, and symbols', () => {
    expect(usernameBase('José María', "O'Brien-Núñez")).toBe('josemaria.obriennunez')
  })

  it('works without a last name', () => {
    expect(usernameBase('Jane', null)).toBe('jane')
  })

  it('pads names shorter than the minimum', () => {
    expect(usernameBase('Al', '')).toBe('aluser')
  })

  it('always satisfies the username pattern', () => {
    for (const [first, last] of [
      ['Jane', 'Doe'],
      ['李', '雷'],
      ['A', ''],
      ['x'.repeat(80), 'y'.repeat(80)],
    ] as const) {
      const base = usernameBase(first, last)
      expect(USERNAME_REGEX.test(base)).toBe(true)
      expect(base.length).toBeGreaterThanOrEqual(3)
      expect(base.length).toBeLessThanOrEqual(30)
    }
  })
})

describe('pickUsername', () => {
  it('keeps a free base', () => {
    expect(pickUsername('jane.doe', new Set())).toBe('jane.doe')
  })

  it('appends the first free suffix', () => {
    expect(pickUsername('jane.doe', new Set(['jane.doe', 'jane.doe2']))).toBe('jane.doe3')
  })

  it('skips reserved names', () => {
    expect(pickUsername('terms', new Set())).toBe('terms2')
  })
})

describe('isReservedUsername', () => {
  it('covers app routes and public pages', () => {
    for (const name of ['invite', 'join', 'verify', 'privacy', 'terms', 'quality-charter', 'notifications', 'login']) {
      expect(isReservedUsername(name)).toBe(true)
    }
    expect(isReservedUsername(' Settings ')).toBe(true)
    expect(isReservedUsername('jane')).toBe(false)
  })
})
