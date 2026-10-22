import { describe, expect, it } from 'vitest'

import { type Course } from '@/db/queries/course'
import {
  buildAnalytics,
  computeTranslationCoverage,
  isReservedSlug,
  parseOutcomesText,
  sanitizeDuration,
  sanitizeOutcomes,
  skillGroupSchema,
  slugifyName,
} from '@/db/queries/course-editing'

const text = (en: string, es = '', ita = '') => ({ en, es, it: ita })

describe('course details', () => {
  it('keeps whole minutes in range and drops everything else', () => {
    expect(sanitizeDuration(45)).toBe(45)
    expect([0, -5, 2.5, 6001, '30', null, undefined].map(sanitizeDuration)).toEqual(Array(7).fill(null))
  })

  it('splits outcomes by line, trims them, and caps the list', () => {
    expect(parseOutcomesText('  First \n\n Second\n')).toEqual(['First', 'Second'])
    expect(parseOutcomesText(Array.from({ length: 12 }, (_, i) => `Item ${i}`).join('\n'))).toHaveLength(8)
    expect(parseOutcomesText('x'.repeat(400))[0]).toHaveLength(160)
  })

  it('sanitizes outcomes per locale and returns null when nothing is left', () => {
    expect(sanitizeOutcomes({ en: [' One ', ''], es: [], it: ['Uno', 3] })).toEqual({ en: ['One'], it: ['Uno'] })
    expect(sanitizeOutcomes({ en: [] })).toBeNull()
    expect(sanitizeOutcomes('nope')).toBeNull()
  })

  it('reserves the framework route slug', () => {
    expect(isReservedSlug('skills')).toBe(true)
    expect(isReservedSlug('teamwork')).toBe(false)
  })
})

describe('computeTranslationCoverage', () => {
  const block = (value: string) => [{ children: [{ text: value }], type: 'p' }]
  const course = {
    description: text('About', 'Sobre'),
    lessons: [
      {
        assessment: null,
        content: { en: block('Body'), es: block('Cuerpo'), it: block('') },
        evaluations: [],
        questions: [
          {
            description: text('Q?', 'Q?'),
            explanation: null,
            options: [{ content: text('A', 'A') }, { content: text('B') }],
          },
        ],
        title: text('One', 'Uno', 'Uno'),
      },
    ],
    outcomes: null,
    title: text('Course', 'Curso', 'Corso'),
  } as unknown as Course

  it('counts only the items that exist in at least one language', () => {
    const coverage = computeTranslationCoverage(course)
    expect(coverage.en).toEqual({ done: 7, percent: 100, total: 7 })
    expect(coverage.es).toEqual({ done: 6, percent: 86, total: 7 })
    expect(coverage.it).toEqual({ done: 2, percent: 29, total: 7 })
  })

  it('reports zero for a course without content', () => {
    const empty = { ...course, description: null, lessons: [], title: text('') } as unknown as Course
    expect(computeTranslationCoverage(empty).en).toEqual({ done: 0, percent: 0, total: 0 })
  })
})

describe('buildAnalytics', () => {
  it('computes rates from real enrollments and ratings', () => {
    const stats = buildAnalytics({
      completedCount: 1,
      enrollmentCount: 4,
      lessons: [
        { done: 4, id: 1, title: text('A') },
        { done: 1, id: 2, title: null },
      ],
      ratings: [5, 4, 4],
      selfAssessments: [3, 4],
    })
    expect(stats).toMatchObject({
      avgRating: 4.3,
      avgSelfAssessment: 3.5,
      completionCount: 1,
      completionRate: 25,
      enrollmentCount: 4,
      ratingCount: 3,
    })
    expect(stats.lessonStats.map(lesson => lesson.completionRate)).toEqual([100, 25])
    expect(stats.ratingDistribution).toEqual([
      { count: 0, value: 1 },
      { count: 0, value: 2 },
      { count: 0, value: 3 },
      { count: 2, value: 4 },
      { count: 1, value: 5 },
    ])
  })

  it('returns zeros and null averages without data', () => {
    const stats = buildAnalytics({
      completedCount: 0,
      enrollmentCount: 0,
      lessons: [],
      ratings: [],
      selfAssessments: [],
    })
    expect(stats).toMatchObject({ avgRating: null, avgSelfAssessment: null, completionRate: 0, ratingCount: 0 })
  })
})

describe('skill groups', () => {
  it('requires a name in every language and trims values', () => {
    const valid = skillGroupSchema.safeParse({ description: text(''), icon: null, name: text(' A ', 'B', 'C') })
    expect(valid.success && valid.data.name.en).toBe('A')
    expect(skillGroupSchema.safeParse({ description: text(''), icon: null, name: text('A', '', 'C') }).success).toBe(
      false
    )
  })

  it('builds an ascii slug from a name', () => {
    expect(slugifyName('Social skills')).toBe('social-skills')
    expect(slugifyName('  Competencias Sociales!  ')).toBe('competencias-sociales')
    expect(slugifyName('Éxito y Ética')).toBe('exito-y-etica')
  })
})
