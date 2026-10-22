import { describe, expect, it } from 'vitest'

import { hasMonthlyActivity, monthStart, toDuration } from '@/components/features/admin/overview-utils'

const row = (overrides: Partial<Parameters<typeof hasMonthlyActivity>[0][number]> = {}) => ({
  certificatesApproved: 0,
  certificatesSubmitted: 0,
  month: '2026-10',
  organizationsApproved: 0,
  organizationsRegistered: 0,
  usersJoined: 0,
  ...overrides,
})

describe('monthStart', () => {
  it('returns the first UTC instant of the month', () => {
    expect(monthStart('2026-10').toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(monthStart('2026-01').toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })
})

describe('toDuration', () => {
  it('keeps hours below two days', () => {
    expect(toDuration(0.5)).toEqual({ unit: 'hour', value: 0.5 })
    expect(toDuration(47.9)).toEqual({ unit: 'hour', value: 47.9 })
  })

  it('switches to days from two days', () => {
    expect(toDuration(48)).toEqual({ unit: 'day', value: 2 })
    expect(toDuration(72)).toEqual({ unit: 'day', value: 3 })
  })
})

describe('hasMonthlyActivity', () => {
  it('is false for all zero months and for unrelated keys', () => {
    expect(hasMonthlyActivity([row(), row()], ['usersJoined', 'organizationsRegistered'])).toBe(false)
    expect(hasMonthlyActivity([row({ certificatesSubmitted: 4 })], ['usersJoined'])).toBe(false)
    expect(hasMonthlyActivity([], ['usersJoined'])).toBe(false)
  })

  it('is true when any listed key has a positive value', () => {
    expect(
      hasMonthlyActivity([row(), row({ organizationsRegistered: 1 })], ['usersJoined', 'organizationsRegistered'])
    ).toBe(true)
  })
})
