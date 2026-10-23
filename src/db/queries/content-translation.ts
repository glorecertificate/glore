import { type Locale } from 'next-intl'

import { type EnumType } from '@/db/types'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { hasText } from '@/lib/translate'

export const CONTENT_ENTITY_TYPES = [
  'course',
  'lesson',
  'doc_article',
  'doc_category',
  'skill_group',
] as const satisfies ContentEntityType[]

export type ContentEntityType = EnumType<'content_entity_type'>

type ContentTranslationStatus = EnumType<'content_translation_status'>

export type TranslationState = ContentTranslationStatus | 'missing' | 'outdated'

export type FieldTable =
  | 'assessments'
  | 'courses'
  | 'doc_articles'
  | 'doc_categories'
  | 'evaluations'
  | 'lessons'
  | 'question_options'
  | 'questions'
  | 'skill_groups'

export interface TranslationField {
  column: string
  id: number
  table: FieldTable
  value: unknown
}

export interface TranslationTarget {
  entityId: number
  entityType: ContentEntityType
  fields: TranslationField[]
}

export interface TranslationRow {
  reviewedById: string | null
  sourceHash: string
  status: ContentTranslationStatus
  translatedById: string | null
  updatedAt: string
}

export interface LocaleTranslation {
  hasContent: boolean
  locale: Locale
  state: TranslationState
}

export interface TargetTranslations {
  entityId: number
  entityType: ContentEntityType
  locales: LocaleTranslation[]
}

export interface TranslationCounts {
  reviewed: number
  total: number
  translated: number
}

export interface LocaleCoverage extends TranslationCounts {
  locale: Locale
}

export const TARGET_LOCALES = LOCALES.filter(locale => locale !== DEFAULT_LOCALE)

const STATE_ORDER = ['missing', 'outdated', 'machine', 'draft', 'reviewed'] as const satisfies TranslationState[]

export const languageChanges = (previous: readonly string[] | null | undefined, next: readonly string[]) => {
  const before = new Set(previous ?? [])
  const after = new Set(next)
  return [
    ...[...after].flatMap(locale => (before.has(locale) ? [] : [{ locale, published: true }])),
    ...[...before].flatMap(locale => (after.has(locale) ? [] : [{ locale, published: false }])),
  ]
}

export const changedLocales = (before: unknown, after: unknown) =>
  LOCALES.filter(
    locale => JSON.stringify(localeValue(before, locale) ?? null) !== JSON.stringify(localeValue(after, locale) ?? null)
  )

export const localeValue = (value: unknown, locale: string) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>)[locale] : undefined

export const hasLocaleContent = (target: TranslationTarget, locale: string) =>
  target.fields.some(field => hasText(localeValue(field.value, locale)))

export const sourceFingerprint = (target: TranslationTarget) =>
  JSON.stringify(
    target.fields.map(field => [field.table, field.id, field.column, localeValue(field.value, DEFAULT_LOCALE) ?? null])
  )

export const classifyTranslation = (
  hasContent: boolean,
  row: Pick<TranslationRow, 'sourceHash' | 'status'> | undefined,
  currentHash: string
): TranslationState => {
  if (!hasContent) return 'missing'
  if (!row) return 'draft'
  if (row.sourceHash !== currentHash) return 'outdated'
  return row.status
}

export const weakestState = (states: TranslationState[]): TranslationState =>
  states.reduce<TranslationState>(
    (weakest, state) => (STATE_ORDER.indexOf(state) < STATE_ORDER.indexOf(weakest) ? state : weakest),
    'reviewed'
  )

export const countStates = (states: TranslationState[]): TranslationCounts => ({
  reviewed: states.filter(state => state === 'reviewed').length,
  total: states.length,
  translated: states.filter(state => state !== 'missing').length,
})

export const summarizeLocale = (items: TargetTranslations[], locale: Locale): LocaleTranslation => {
  const entries = items.flatMap(item => item.locales.filter(entry => entry.locale === locale))
  return {
    hasContent: entries.some(entry => entry.hasContent),
    locale,
    state: entries.length === 0 ? 'missing' : weakestState(entries.map(entry => entry.state)),
  }
}

export const localeStates = (items: TargetTranslations[], locale: Locale) =>
  items.flatMap(item => item.locales.flatMap(entry => (entry.locale === locale ? [entry.state] : [])))

export const coverageOf = (items: TargetTranslations[]): LocaleCoverage[] =>
  TARGET_LOCALES.map(locale => ({
    locale,
    ...countStates(localeStates(items, locale)),
  }))

export const targetField = (
  table: TranslationField['table'],
  id: number,
  column: string,
  value: unknown
): TranslationField => ({
  column,
  id,
  table,
  value,
})

interface LessonRow {
  assessments: { description: unknown; id: number }[]
  content: unknown
  evaluations: { description: unknown; id: number }[]
  id: number
  questions: {
    description: unknown
    explanation: unknown
    id: number
    options: { content: unknown; id: number }[]
  }[]
  title: unknown
}

export const lessonTarget = (row: LessonRow): TranslationTarget => ({
  entityId: row.id,
  entityType: 'lesson',
  fields: [
    targetField('lessons', row.id, 'title', row.title),
    targetField('lessons', row.id, 'content', row.content),
    ...row.questions.flatMap(question => [
      targetField('questions', question.id, 'description', question.description),
      targetField('questions', question.id, 'explanation', question.explanation),
      ...question.options.map(option => targetField('question_options', option.id, 'content', option.content)),
    ]),
    ...row.evaluations.map(evaluation =>
      targetField('evaluations', evaluation.id, 'description', evaluation.description)
    ),
    ...row.assessments.map(assessment =>
      targetField('assessments', assessment.id, 'description', assessment.description)
    ),
  ],
})

export const articleTarget = (row: {
  content: unknown
  excerpt: unknown
  id: number
  title: unknown
}): TranslationTarget => ({
  entityId: row.id,
  entityType: 'doc_article',
  fields: [
    targetField('doc_articles', row.id, 'title', row.title),
    targetField('doc_articles', row.id, 'excerpt', row.excerpt),
    targetField('doc_articles', row.id, 'content', row.content),
  ],
})

export const categoryTarget = (row: { description: unknown; id: number; title: unknown }): TranslationTarget => ({
  entityId: row.id,
  entityType: 'doc_category',
  fields: [
    targetField('doc_categories', row.id, 'title', row.title),
    targetField('doc_categories', row.id, 'description', row.description),
  ],
})

export const skillGroupTarget = (row: { description: unknown; id: number; name: unknown }): TranslationTarget => ({
  entityId: row.id,
  entityType: 'skill_group',
  fields: [
    targetField('skill_groups', row.id, 'name', row.name),
    targetField('skill_groups', row.id, 'description', row.description),
  ],
})
