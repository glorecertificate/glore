import { describe, expect, it } from 'vitest'

import {
  addMonths,
  ageTone,
  chooseTutor,
  daysBetween,
  formatActivityDate,
  formatActivityPeriod,
  generateCertificateCode,
  journeySteps,
  linkedInProfileUrl,
  meetsActivityRule,
  mergeCertificateValues,
  missingPersonalData,
  normalizeCertificateCode,
  pdfDate,
} from '@/components/features/certificates/rules'

const period = (activityStartDate: string, activityEndDate: string, activityDuration = 10) => ({
  activityDuration,
  activityEndDate,
  activityStartDate,
})

describe('addMonths', () => {
  it('adds calendar months and clamps to the month end', () => {
    expect(addMonths('2026-01-15', 3)).toBe('2026-04-15')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2025-11-30', 3)).toBe('2026-02-28')
  })
})

describe('meetsActivityRule', () => {
  it('accepts 100 hours in any period', () => {
    expect(meetsActivityRule(period('2026-01-01', '2026-01-10', 100))).toBe(true)
    expect(meetsActivityRule(period('2026-01-01', '2026-01-10', 99))).toBe(false)
  })

  it('accepts 3 months, counting the end date as part of the period', () => {
    expect(meetsActivityRule(period('2026-01-01', '2026-03-31'))).toBe(true)
    expect(meetsActivityRule(period('2026-01-01', '2026-03-30'))).toBe(false)
    expect(meetsActivityRule(period('2026-01-15', '2026-06-01'))).toBe(true)
  })

  it('rejects malformed dates unless the hours rule holds', () => {
    expect(meetsActivityRule(period('', ''))).toBe(false)
    expect(meetsActivityRule(period('', '', 100))).toBe(true)
  })

  it('reads the thresholds from the given config', () => {
    expect(
      meetsActivityRule(period('2026-01-01', '2026-01-10', 30), { minActivityHours: 30, minActivityMonths: 12 })
    ).toBe(true)
  })
})

describe('chooseTutor', () => {
  const load = (userId: string, openRequests: number, lastAssignedAt: string | null = null) => ({
    lastAssignedAt,
    openRequests,
    userId,
  })

  it('picks the tutor with the fewest open requests', () => {
    expect(chooseTutor([load('a', 3), load('b', 1), load('c', 2)])).toBe('b')
  })

  it('breaks ties with the oldest last assignment', () => {
    expect(
      chooseTutor([
        load('a', 1, '2026-10-02 10:00:00'),
        load('b', 1, '2026-10-01 10:00:00'),
        load('c', 1, '2026-10-03 10:00:00'),
      ])
    ).toBe('b')
  })

  it('treats a tutor who was never assigned as the oldest', () => {
    expect(chooseTutor([load('a', 0, '2026-10-01 10:00:00'), load('b', 0, null)])).toBe('b')
  })

  it('is deterministic when everything ties and returns null without tutors', () => {
    expect(chooseTutor([load('b', 0), load('a', 0)])).toBe('a')
    expect(chooseTutor([])).toBeNull()
  })
})

describe('missingPersonalData', () => {
  it('lists every empty field', () => {
    expect(missingPersonalData({})).toEqual(['lastName', 'birthday', 'birthPlace', 'nationality'])
    expect(
      missingPersonalData({ birthPlace: ' ', birthday: '2000-01-01', lastName: 'Rossi', nationality: null })
    ).toEqual(['birthPlace', 'nationality'])
    expect(
      missingPersonalData({ birthPlace: 'Milan', birthday: '2000-01-01', lastName: 'Rossi', nationality: 'it' })
    ).toEqual([])
  })
})

describe('generateCertificateCode', () => {
  it('returns three Crockford base32 groups of four characters', () => {
    const codes = Array.from({ length: 50 }, generateCertificateCode)
    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/u)
    }
    expect(new Set(codes).size).toBe(codes.length)
  })
})

describe('mergeCertificateValues', () => {
  const stored = {
    activityDescription: 'Helped',
    activityDuration: 120,
    activityEndDate: '2026-06-30',
    activityLocation: 'Milan',
    activityStartDate: '2026-01-10',
    language: 'en',
    rating: { certificationSupport: null, comment: null, experience: 4, support: null, wouldRecommend: null },
    skills: [
      { courseId: 2, evidence: 'b', selfLevel: 3, sortOrder: 1 },
      { courseId: 1, evidence: 'a', selfLevel: 4, sortOrder: 0 },
    ],
    tasks: ['One'],
  }

  it('keeps stored values the edit leaves out and orders skills', () => {
    const merged = mergeCertificateValues(stored, { activityLocation: 'Rome' })
    expect(merged.activityLocation).toBe('Rome')
    expect(merged.activityDuration).toBe(120)
    expect(merged.skills.map(({ courseId }) => courseId)).toEqual([1, 2])
    expect(merged.rating.experience).toBe(4)
  })

  it('replaces skills and overlays rating fields', () => {
    const merged = mergeCertificateValues(stored, { rating: { comment: 'Great' }, skills: [{ courseId: 9 }] })
    expect(merged.skills).toEqual([{ courseId: 9 }])
    expect(merged.rating).toMatchObject({ comment: 'Great', experience: 4 })
  })
})

describe('review age', () => {
  const now = new Date('2026-03-10T12:00:00Z')

  it('counts whole days and never goes negative', () => {
    expect(daysBetween('2026-03-05T12:00:00Z', now)).toBe(5)
    expect(daysBetween('2026-03-10T00:00:00Z', now)).toBe(0)
    expect(daysBetween('2026-03-12T00:00:00Z', now)).toBe(0)
  })

  it('maps days to the reminder thresholds', () => {
    expect(ageTone(0)).toBe('fresh')
    expect(ageTone(2)).toBe('fresh')
    expect(ageTone(3)).toBe('due')
    expect(ageTone(6)).toBe('due')
    expect(ageTone(7)).toBe('overdue')
    expect(ageTone(4, [5, 10])).toBe('fresh')
  })
})

describe('journeySteps', () => {
  it('marks the current stage of an open request', () => {
    expect(journeySteps('submitted').map(({ state }) => state)).toEqual(['done', 'current', 'upcoming', 'upcoming'])
    expect(journeySteps('draft')[0]).toMatchObject({ stage: 'draft', state: 'current' })
  })

  it('keeps changes requested on the review stage with an outcome', () => {
    expect(journeySteps('changes_requested')[2]).toEqual({
      outcome: 'changes_requested',
      stage: 'review',
      state: 'current',
    })
  })

  it('fails the stage where a request ended', () => {
    expect(journeySteps('rejected')[3]).toMatchObject({ outcome: 'rejected', state: 'failed' })
    expect(journeySteps('revoked')[3]).toMatchObject({ outcome: 'revoked', state: 'failed' })
    expect(journeySteps('withdrawn')[2]).toMatchObject({ outcome: 'withdrawn', state: 'failed' })
  })

  it('completes every stage once approved', () => {
    const steps = journeySteps('approved')
    expect(steps.every(({ outcome, state }) => state === 'done' && outcome === null)).toBe(true)
  })
})

describe('pdfDate', () => {
  it('formats ISO dates like the PDF', () => {
    expect(pdfDate('2026-01-10')).toBe('10.01.2026')
    expect(pdfDate(null)).toBeNull()
  })
})

describe('formatActivityDate', () => {
  const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })

  it('formats stored ISO dates', () => {
    expect(formatActivityDate('2026-01-10', formatter)).toBe('January 10, 2026')
  })

  it('returns null for unset or malformed dates', () => {
    expect(formatActivityDate('', formatter)).toBeNull()
    expect(formatActivityDate(null, formatter)).toBeNull()
    expect(formatActivityDate(undefined, formatter)).toBeNull()
    expect(formatActivityDate('not-a-date', formatter)).toBeNull()
  })
})

describe('formatActivityPeriod', () => {
  const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })
  const template = ({ end, start }: { end: string; start: string }) => `${start} to ${end}`

  it('renders the period when both dates are set', () => {
    const certificate = { activityEndDate: '2026-06-30', activityStartDate: '2026-01-10' }
    expect(formatActivityPeriod(certificate, formatter, template)).toBe('Jan 10, 2026 to Jun 30, 2026')
  })

  it('renders a placeholder for a draft without dates', () => {
    expect(formatActivityPeriod({ activityEndDate: '', activityStartDate: '' }, formatter, template)).toBe('-')
    expect(formatActivityPeriod({ activityEndDate: '2026-06-30', activityStartDate: '' }, formatter, template)).toBe(
      '-'
    )
  })
})

describe('linkedInProfileUrl', () => {
  it('builds the add to profile link without a company page', () => {
    const url = new URL(
      linkedInProfileUrl({
        code: 'ABCD-EFGH-JKMN',
        issuedAt: '2026-03-14T10:00:00.000Z',
        name: 'GloRe Certificate',
        organizationName: 'Associazione Joint',
        url: 'https://example.test/verify/ABCD-EFGH-JKMN',
      })
    )
    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/profile/add')
    expect(url.searchParams.get('startTask')).toBe('CERTIFICATION_NAME')
    expect(url.searchParams.get('organizationName')).toBe('Associazione Joint')
    expect(url.searchParams.get('issueYear')).toBe('2026')
    expect(url.searchParams.get('issueMonth')).toBe('3')
    expect(url.searchParams.get('certId')).toBe('ABCD-EFGH-JKMN')
    expect(url.searchParams.has('organizationId')).toBe(false)
  })
})

describe('normalizeCertificateCode', () => {
  it('accepts a code typed in any case, with spaces or without dashes', () => {
    expect(normalizeCertificateCode('abcd-efgh-jkmn')).toBe('ABCD-EFGH-JKMN')
    expect(normalizeCertificateCode(' abcd efgh jkmn ')).toBe('ABCD-EFGH-JKMN')
    expect(normalizeCertificateCode('ABCDEFGHJKMN')).toBe('ABCD-EFGH-JKMN')
  })

  it('maps the characters Crockford treats as look-alikes', () => {
    expect(normalizeCertificateCode('o0il-1111-2222')).toBe('0011-1111-2222')
  })

  it('rejects codes that cannot exist', () => {
    expect(normalizeCertificateCode('')).toBeNull()
    expect(normalizeCertificateCode('ABCD-EFGH')).toBeNull()
    expect(normalizeCertificateCode('ABCD-EFGH-JKMN-PQRS')).toBeNull()
    expect(normalizeCertificateCode('ABCD-EFGH-JKMU')).toBeNull()
    expect(normalizeCertificateCode("ABCD-EFGH-JK'; --")).toBeNull()
  })
})
