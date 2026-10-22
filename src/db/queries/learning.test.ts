import { describe, expect, it } from 'vitest'

import {
  type OverviewRow,
  averageRating,
  buildOverview,
  courseAccess,
  enrollableTypes,
  evaluateEligibility,
  pickLocale,
  pickLocaleList,
  resolveCourseLanguage,
} from '@/db/queries/learning'

const published = { archivedAt: null, languages: ['en', 'it'], type: 'skill' as const }

describe('courseAccess', () => {
  it('gives editors every course', () => {
    expect(courseAccess({ canEdit: true, role: null }, { ...published, archivedAt: 'x', languages: [] })).toBe('editor')
  })

  it('hides archived and unpublished courses from members', () => {
    expect(courseAccess({ canEdit: false, role: 'volunteer' }, { ...published, archivedAt: 'x' })).toBeNull()
    expect(courseAccess({ canEdit: false, role: 'volunteer' }, { ...published, languages: [] })).toBeNull()
    expect(courseAccess({ canEdit: false, role: 'tutor' }, { ...published, languages: null })).toBeNull()
  })

  it('follows the course types each role may take', () => {
    expect(courseAccess({ canEdit: false, role: 'learner' }, published)).toBeNull()
    expect(courseAccess({ canEdit: false, role: 'learner' }, { ...published, type: 'learner' })).toBe('learner')
    expect(courseAccess({ canEdit: false, role: 'volunteer' }, { ...published, type: 'learner' })).toBeNull()
    expect(courseAccess({ canEdit: false, role: 'volunteer' }, published)).toBe('learner')
    expect(courseAccess({ canEdit: false, role: 'volunteer' }, { ...published, type: null })).toBe('learner')
  })

  it('opens every published course to org staff in viewer mode', () => {
    for (const role of ['admin', 'representative', 'tutor'] as const) {
      expect(courseAccess({ canEdit: false, role }, published)).toBe('viewer')
    }
    expect(courseAccess({ canEdit: false, role: null }, published)).toBeNull()
  })

  it('lists enrollable types per role', () => {
    expect(enrollableTypes('learner')).toEqual(['intro', 'learner'])
    expect(enrollableTypes('volunteer')).toEqual(['intro', 'skill'])
    expect(enrollableTypes('tutor')).toEqual([])
    expect(enrollableTypes(null)).toEqual([])
  })
})

describe('locale helpers', () => {
  it('falls back to english and then any filled locale', () => {
    expect(pickLocale({ en: 'Hello', es: '', it: 'Ciao' }, 'es')).toBe('Hello')
    expect(pickLocale({ es: '', it: 'Ciao' }, 'es')).toBe('Ciao')
    expect(pickLocale(null, 'en')).toBeNull()
    expect(pickLocaleList({ en: ['A'], es: [] }, 'es')).toEqual(['A'])
    expect(pickLocaleList(null, 'es')).toEqual([])
  })

  it('resolves the course language by preference', () => {
    const base = { languages: ['en', 'it'] as ('en' | 'es' | 'it')[], preferred: 'es' as const }
    expect(resolveCourseLanguage({ ...base, requested: 'it' })).toBe('it')
    expect(resolveCourseLanguage({ ...base, enrolled: 'it', requested: 'es' })).toBe('it')
    expect(resolveCourseLanguage({ ...base })).toBe('en')
    expect(resolveCourseLanguage({ languages: ['it'], preferred: 'es' })).toBe('it')
  })
})

const row = (overrides: Partial<OverviewRow> = {}): OverviewRow => ({
  archivedAt: null,
  description: { en: 'About' },
  durationMinutes: 30,
  icon: 'heart',
  id: 1,
  languages: ['en', 'it'],
  lessons: [
    {
      assessments: [],
      evaluations: [],
      id: 12,
      questions: [{ id: 1 }],
      sortOrder: 2,
      title: { en: 'Second' },
      userLessons: [],
    },
    {
      assessments: [],
      evaluations: [],
      id: 11,
      questions: [],
      sortOrder: 1,
      title: { en: 'First' },
      userLessons: [{ id: 1 }],
    },
  ],
  outcomes: { en: ['One', ' '] },
  ratings: [{ rating: 5 }, { rating: 4 }],
  skillGroup: { id: 2, name: { en: 'Work skills' }, slug: 'work-skills' },
  slug: 'teamwork',
  title: { en: 'Teamwork' },
  type: 'skill',
  userCourses: [],
  ...overrides,
})

describe('buildOverview', () => {
  it('orders lessons, marks status, and resumes at the first open lesson', () => {
    const overview = buildOverview(row({ userCourses: [{ completedAt: null, locale: 'en' }] }), 'en')
    expect(overview.lessons.map(({ id, status }) => [id, status])).toEqual([
      [11, 'completed'],
      [12, 'current'],
    ])
    expect(overview.resumeLessonId).toBe(12)
    expect(overview.progress).toEqual({ completed: 1, percent: 50, total: 2 })
    expect(overview.enrollment).toEqual({ completedAt: null, locale: 'en' })
  })

  it('has no current lesson before enrollment', () => {
    const overview = buildOverview(row(), 'en')
    expect(overview.lessons.map(({ status }) => status)).toEqual(['completed', 'upcoming'])
    expect(overview.enrollment).toBeNull()
  })

  it('handles a course without lessons or ratings', () => {
    const overview = buildOverview(row({ lessons: [], ratings: [], skillGroup: null, type: null }), 'es')
    expect(overview.progress).toEqual({ completed: 0, percent: 0, total: 0 })
    expect(overview.resumeLessonId).toBeNull()
    expect(overview.rating).toEqual({ average: null, count: 0 })
    expect(overview.type).toBe('intro')
    expect(overview.title).toBe('Teamwork')
    expect(overview.outcomes).toEqual(['One'])
  })

  it('averages ratings to one decimal', () => {
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toBe(4.3)
    expect(averageRating([])).toBeNull()
  })
})

describe('evaluateEligibility', () => {
  const rules = { minRating: 3, minSkills: 3 }

  it('needs enough completed skills and a high enough average', () => {
    expect(evaluateEligibility({ averageRating: 4, completedCourseIds: [1, 2, 3] }, rules)).toMatchObject({
      eligible: true,
      remaining: 0,
    })
    expect(evaluateEligibility({ averageRating: 4, completedCourseIds: [1] }, rules)).toMatchObject({
      eligible: false,
      remaining: 2,
    })
    expect(evaluateEligibility({ averageRating: 2.5, completedCourseIds: [1, 2, 3] }, rules)).toMatchObject({
      eligible: false,
      lowRating: true,
    })
  })
})
