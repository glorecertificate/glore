import { type Course } from '@/db/queries/course'
import { type Lesson } from '@/db/queries/lesson'
import { type IntlRecord } from '@/lib/i18n'
import { hasText } from '@/lib/translate'
import { isTempId } from '@/lib/utils'

type IntlValue = IntlRecord | null | undefined

export interface EditorField {
  key: string
  lessonId: number | null
  read: (course: Course) => IntlValue
  write: (course: Course, record: IntlRecord) => Course
}

const updateLesson = (course: Course, lessonId: number, update: (lesson: Lesson) => Lesson): Course => ({
  ...course,
  lessons: course.lessons.map(lesson => (lesson.id === lessonId ? update(lesson) : lesson)),
})

export const listEditorFields = (course: Course): EditorField[] => {
  const fields: EditorField[] = []
  if (!isTempId(course.id)) {
    fields.push(
      {
        key: `courses:${course.id}:title`,
        lessonId: null,
        read: current => current.title,
        write: (current, record) => ({ ...current, title: record }),
      },
      {
        key: `courses:${course.id}:description`,
        lessonId: null,
        read: current => current.description as IntlValue,
        write: (current, record) => ({ ...current, description: record }) as Course,
      }
    )
  }
  for (const lesson of course.lessons) {
    if (lesson.id === undefined || isTempId(lesson.id)) continue
    const lessonId = lesson.id
    const base = { lessonId }
    const find = (current: Course) => current.lessons.find(item => item.id === lessonId)
    fields.push(
      {
        ...base,
        key: `lessons:${lessonId}:title`,
        read: current => find(current)?.title as IntlValue,
        write: (current, record) => updateLesson(current, lessonId, item => ({ ...item, title: record })),
      },
      {
        ...base,
        key: `lessons:${lessonId}:content`,
        read: current => find(current)?.content as IntlValue,
        write: (current, record) => updateLesson(current, lessonId, item => ({ ...item, content: record })),
      }
    )
    for (const question of lesson.questions) {
      if (isTempId(question.id)) continue
      const questionId = question.id
      const findQuestion = (current: Course) => find(current)?.questions.find(item => item.id === questionId)
      const writeQuestion = (
        current: Course,
        update: (item: Lesson['questions'][number]) => Lesson['questions'][number]
      ) =>
        updateLesson(current, lessonId, item => ({
          ...item,
          questions: item.questions.map(entry => (entry.id === questionId ? update(entry) : entry)),
        }))
      fields.push(
        {
          ...base,
          key: `questions:${questionId}:description`,
          read: current => findQuestion(current)?.description as IntlValue,
          write: (current, record) => writeQuestion(current, entry => ({ ...entry, description: record })),
        },
        {
          ...base,
          key: `questions:${questionId}:explanation`,
          read: current => findQuestion(current)?.explanation as IntlValue,
          write: (current, record) => writeQuestion(current, entry => ({ ...entry, explanation: record })),
        }
      )
      for (const option of question.options) {
        if (isTempId(option.id)) continue
        const optionId = option.id
        fields.push({
          ...base,
          key: `question_options:${optionId}:content`,
          read: current => findQuestion(current)?.options.find(entry => entry.id === optionId)?.content as IntlValue,
          write: (current, record) =>
            writeQuestion(current, entry => ({
              ...entry,
              options: entry.options.map(candidate =>
                candidate.id === optionId ? { ...candidate, content: record } : candidate
              ),
            })),
        })
      }
    }
    for (const evaluation of lesson.evaluations) {
      if (isTempId(evaluation.id)) continue
      const evaluationId = evaluation.id
      fields.push({
        ...base,
        key: `evaluations:${evaluationId}:description`,
        read: current => find(current)?.evaluations.find(entry => entry.id === evaluationId)?.description as IntlValue,
        write: (current, record) =>
          updateLesson(current, lessonId, item => ({
            ...item,
            evaluations: item.evaluations.map(entry =>
              entry.id === evaluationId ? { ...entry, description: record } : entry
            ),
          })),
      })
    }
    const assessment = lesson.assessment
    if (assessment && !isTempId(assessment.id)) {
      const assessmentId = assessment.id
      fields.push({
        ...base,
        key: `assessments:${assessmentId}:description`,
        read: current => find(current)?.assessment?.description as IntlValue,
        write: (current, record) =>
          updateLesson(current, lessonId, item =>
            item.assessment ? { ...item, assessment: { ...item.assessment, description: record } } : item
          ),
      })
      for (const level of assessment.levelDescriptions ?? []) {
        if (isTempId(level.id)) continue
        const levelId = level.id
        fields.push({
          ...base,
          key: `skill_level_descriptions:${levelId}:description`,
          read: current =>
            find(current)?.assessment?.levelDescriptions?.find(entry => entry.id === levelId)?.description as IntlValue,
          write: (current, record) =>
            updateLesson(current, lessonId, item =>
              item.assessment
                ? {
                    ...item,
                    assessment: {
                      ...item.assessment,
                      levelDescriptions: (item.assessment.levelDescriptions ?? []).map(entry =>
                        entry.id === levelId ? { ...entry, description: record } : entry
                      ),
                    },
                  }
                : item
            ),
        })
      }
    }
  }
  return fields
}

export const readLocale = (field: EditorField, course: Course, locale: string): unknown =>
  field.read(course)?.[locale as keyof IntlRecord]

export const writeLocale = (field: EditorField, course: Course, locale: string, value: unknown): Course =>
  field.write(course, { ...(field.read(course) ?? {}), [locale]: value } as IntlRecord)

const stripId = (key: string, value: unknown) => (key === 'id' && typeof value === 'string' ? undefined : value)

export const sameValue = (left: unknown, right: unknown) =>
  JSON.stringify(left ?? null, stripId) === JSON.stringify(right ?? null, stripId)

export const fillKey = (locale: string, key: string) => `${locale}|${key}`

export interface PlanInput {
  course: Course
  fieldKeys?: string[]
  replace: boolean
  source: string
  targets: string[]
}

interface TranslateRequestField {
  existing: Record<string, boolean>
  key: string
  text: unknown
}

interface PlanSummary {
  fill: number
  keep: number
  replace: number
}

export interface TranslatePlan {
  fields: TranslateRequestField[]
  seen: Map<string, unknown>
  summary: Record<string, PlanSummary>
}

export const planTranslation = ({ course, fieldKeys, replace, source, targets }: PlanInput): TranslatePlan => {
  const wanted = fieldKeys ? new Set(fieldKeys) : null
  const summary = Object.fromEntries(targets.map(locale => [locale, { fill: 0, keep: 0, replace: 0 }]))
  const fields: TranslateRequestField[] = []
  const seen = new Map<string, unknown>()
  for (const field of listEditorFields(course)) {
    if (wanted && !wanted.has(field.key)) continue
    const text = readLocale(field, course, source)
    if (!hasText(text)) continue
    const existing: Record<string, boolean> = {}
    for (const locale of targets) {
      const value = readLocale(field, course, locale)
      const present = hasText(value)
      seen.set(fillKey(locale, field.key), value)
      existing[locale] = present
      const counts = summary[locale]
      if (locale === source || !counts) continue
      const bucket = present ? (replace ? 'replace' : 'keep') : 'fill'
      counts[bucket] += 1
    }
    fields.push({ existing, key: field.key, text })
  }
  return { fields, seen, summary }
}

const readFieldValue = (course: Course, key: string): IntlValue => {
  const [table, id, column] = key.split(':')
  if (table === 'courses') return (course as unknown as Record<string, IntlValue>)[column ?? '']
  const lesson = course.lessons.find(item => String(item.id) === id)
  return lesson ? (lesson as unknown as Record<string, IntlValue>)[column ?? ''] : undefined
}

export const sourcesOf = (course: Course, key: string, locales: readonly string[], exclude: string) => {
  const value = readFieldValue(course, key)
  return locales.filter(locale => locale !== exclude && hasText(value?.[locale as keyof IntlRecord]))
}
