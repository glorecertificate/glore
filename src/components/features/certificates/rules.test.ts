import { describe, expect, it } from 'vitest'

import {
  addMonths,
  chooseTutor,
  generateCertificateCode,
  meetsActivityRule,
  mergeCertificateValues,
  missingPersonalData,
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
