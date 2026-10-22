import { z } from 'zod'

import { type Course } from '@/db/queries/course'
import { type IntlRecord, LOCALES } from '@/lib/i18n'

export const COURSE_DURATION_MAX = 6000
export const OUTCOMES_MAX = 8
const OUTCOME_MAX_LENGTH = 160

const RESERVED_COURSE_SLUGS = new Set(['skills'])

export const isReservedSlug = (slug: string) => RESERVED_COURSE_SLUGS.has(slug)

export const sanitizeDuration = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= COURSE_DURATION_MAX ? value : null

export const parseOutcomesText = (text: string) =>
  text.split('\n').reduce<string[]>((outcomes, line) => {
    const outcome = line.trim().slice(0, OUTCOME_MAX_LENGTH)
    if (outcome && outcomes.length < OUTCOMES_MAX) outcomes.push(outcome)
    return outcomes
  }, [])

export const sanitizeOutcomes = (outcomes: unknown): Partial<IntlRecord<string[]>> | null => {
  if (!outcomes || typeof outcomes !== 'object') return null
  const record = outcomes as Record<string, unknown>
  const result = LOCALES.reduce<Partial<IntlRecord<string[]>>>((acc, locale) => {
    const value = record[locale]
    if (!Array.isArray(value)) return acc
    const list = parseOutcomesText(value.filter((item): item is string => typeof item === 'string').join('\n'))
    if (list.length > 0) acc[locale] = list
    return acc
  }, {})
  return Object.keys(result).length > 0 ? result : null
}

const hasText = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some(hasText)
  if (value && typeof value === 'object') {
    const node = value as { children?: unknown; text?: unknown }
    return hasText(node.text) || hasText(node.children)
  }
  return false
}

const localeValue = (record: unknown, locale: string) =>
  record && typeof record === 'object' ? (record as Record<string, unknown>)[locale] : undefined

export interface TranslationCoverage {
  done: number
  percent: number
  total: number
}

export const computeTranslationCoverage = (course: Course): Record<(typeof LOCALES)[number], TranslationCoverage> => {
  const sources: unknown[] = [course.title, course.description, course.outcomes]
  for (const lesson of course.lessons) {
    sources.push(lesson.title, lesson.content)
    for (const question of lesson.questions ?? []) {
      sources.push(question.description, question.explanation)
      for (const option of question.options) sources.push(option.content)
    }
    for (const evaluation of lesson.evaluations ?? []) sources.push(evaluation.description)
    if (lesson.assessment) sources.push(lesson.assessment.description)
  }
  const relevant = sources.filter(source => LOCALES.some(locale => hasText(localeValue(source, locale))))

  return LOCALES.reduce(
    (coverage, locale) => {
      const done = relevant.reduce<number>((sum, source) => sum + (hasText(localeValue(source, locale)) ? 1 : 0), 0)
      const total = relevant.length
      coverage[locale] = { done, percent: total > 0 ? Math.round((done / total) * 100) : 0, total }
      return coverage
    },
    {} as Record<(typeof LOCALES)[number], TranslationCoverage>
  )
}

export interface CourseAnalyticsStats {
  avgRating: number | null
  avgSelfAssessment: number | null
  completionCount: number
  completionRate: number
  enrollmentCount: number
  lessonStats: { completionCount: number; completionRate: number; id: number; title: IntlRecord | null }[]
  ratingCount: number
  ratingDistribution: { count: number; value: number }[]
}

const mean = (values: number[]) =>
  values.length > 0 ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null

const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

export const buildAnalytics = ({
  completedCount,
  enrollmentCount,
  lessons,
  ratings,
  selfAssessments,
}: {
  completedCount: number
  enrollmentCount: number
  lessons: { done: number; id: number; title: IntlRecord | null }[]
  ratings: number[]
  selfAssessments: number[]
}): CourseAnalyticsStats => ({
  avgRating: mean(ratings),
  avgSelfAssessment: mean(selfAssessments),
  completionCount: completedCount,
  completionRate: percentOf(completedCount, enrollmentCount),
  enrollmentCount,
  lessonStats: lessons.map(({ done, id, title }) => ({
    completionCount: done,
    completionRate: percentOf(done, enrollmentCount),
    id,
    title,
  })),
  ratingCount: ratings.length,
  ratingDistribution: [1, 2, 3, 4, 5].map(value => ({
    count: ratings.reduce((sum, rating) => sum + (rating === value ? 1 : 0), 0),
    value,
  })),
})

const intlText = (max: number) => z.record(z.enum(LOCALES), z.string().trim().max(max))

export const skillGroupSchema = z.object({
  description: intlText(300),
  icon: z.string().max(60).nullable(),
  name: intlText(80).refine(name => LOCALES.every(locale => name[locale].length > 0)),
})

export type SkillGroupInput = z.infer<typeof skillGroupSchema>

export const slugifyName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
