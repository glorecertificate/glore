import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import { type LessonWithRelations, parseLesson } from '@/db/queries/lesson'
import { LOCALES } from '@/lib/i18n'

const lessons = {
  assessment: { assessment: { userAssessments: [] } },
  evaluations: { evaluations: [{ userEvaluations: [] }] },
  questions: { questions: [{ options: [] }] },
  reading: {},
} as unknown as Record<string, Partial<LessonWithRelations>>

describe('parseLesson', () => {
  it.each(Object.entries(lessons))('derives the %s type', (type, lesson) => {
    expect(parseLesson(lesson).type).toBe(type)
  })

  it.each(LOCALES)('labels every lesson type in %s', async locale => {
    const { default: messages } = await import(`~/messages/${locale}.json`)
    const t = createTranslator({ locale, messages, namespace: 'CourseEditor' })
    const fallback = t('lessonType', { type: 'unknown' })
    const labels = Object.values(lessons).map(lesson => t('lessonType', { type: parseLesson(lesson).type }))
    expect(labels).not.toContain(fallback)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
