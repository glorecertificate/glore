import { describe, expect, it } from 'vitest'

import {
  ADMIN_OVERVIEW_MONTHS,
  overviewMonths,
  roundHours,
  sumPipeline,
  toOverviewMonthly,
  toReviewMonthly,
} from './admin-overview'
import { toPipeline } from './organization-insights'

describe('overviewMonths', () => {
  it('lists twelve UTC months ending with the current one', () => {
    const months = overviewMonths(new Date('2026-10-22T10:00:00.000Z'))
    expect(months).toHaveLength(ADMIN_OVERVIEW_MONTHS)
    expect(months[0]).toBe('2025-11')
    expect(months.at(-1)).toBe('2026-10')
  })

  it('does not drift at month boundaries', () => {
    expect(overviewMonths(new Date('2026-01-01T00:00:00.000Z')).at(-1)).toBe('2026-01')
    expect(overviewMonths(new Date('2026-12-31T23:59:59.000Z')).at(-1)).toBe('2026-12')
  })
})

describe('toOverviewMonthly', () => {
  const months = ['2026-08', '2026-09', '2026-10']

  it('fills months without data with zeros', () => {
    const rows = toOverviewMonthly(months, {
      certificatesApproved: [{ month: '2026-10', total: 2 }],
      certificatesSubmitted: [{ month: '2026-09', total: 5 }],
      organizationsApproved: [],
      organizationsRegistered: [{ month: '2026-08', total: 1 }],
      usersJoined: [
        { month: '2026-08', total: 4 },
        { month: '2026-10', total: 9 },
      ],
    })
    expect(rows).toEqual([
      {
        certificatesApproved: 0,
        certificatesSubmitted: 0,
        month: '2026-08',
        organizationsApproved: 0,
        organizationsRegistered: 1,
        usersJoined: 4,
      },
      {
        certificatesApproved: 0,
        certificatesSubmitted: 5,
        month: '2026-09',
        organizationsApproved: 0,
        organizationsRegistered: 0,
        usersJoined: 0,
      },
      {
        certificatesApproved: 2,
        certificatesSubmitted: 0,
        month: '2026-10',
        organizationsApproved: 0,
        organizationsRegistered: 0,
        usersJoined: 9,
      },
    ])
  })

  it('ignores months outside the window', () => {
    const rows = toOverviewMonthly(months, {
      certificatesApproved: [],
      certificatesSubmitted: [],
      organizationsApproved: [],
      organizationsRegistered: [],
      usersJoined: [{ month: '2020-01', total: 99 }],
    })
    expect(rows.every(row => row.usersJoined === 0)).toBe(true)
  })
})

describe('toReviewMonthly', () => {
  it('keeps the reviewed months and leaves the rest empty', () => {
    const rows = toReviewMonthly(
      ['2026-09', '2026-10'],
      [{ averageHours: 5.5, medianHours: 4, month: '2026-10', sample: 3 }]
    )
    expect(rows).toEqual([
      { averageHours: null, medianHours: null, month: '2026-09', sample: 0 },
      { averageHours: 5.5, medianHours: 4, month: '2026-10', sample: 3 },
    ])
  })
})

describe('roundHours', () => {
  it.each([
    [null, null],
    [undefined, null],
    ['not a number', null],
    ['4.449', 4.4],
    [4.45, 4.5],
    [0, 0],
  ])('rounds %s to %s', (input, expected) => {
    expect(roundHours(input)).toBe(expected)
  })
})

describe('sumPipeline', () => {
  it('adds every non-draft status', () => {
    const pipeline = toPipeline([
      { status: 'submitted', total: 2 },
      { status: 'approved', total: 5 },
      { status: 'draft', total: 7 },
    ])
    expect(sumPipeline(pipeline)).toBe(7)
  })
})
