import 'server-only'

import { createHash } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import {
  type ContentEntityType,
  type FieldTable,
  type TranslationField,
  type TranslationTarget,
  sourceFingerprint,
} from '@/db/queries/content-translation'
import {
  assessments,
  contentTranslations,
  courses,
  docArticles,
  docCategories,
  evaluations,
  lessons,
  questionOptions,
  questions,
  skillGroups,
} from '@/db/schema'
import { type Any } from '@/lib/types'

type TranslationMode = 'edited' | 'machine' | 'reviewed'

interface SaveTranslation {
  locale: string
  mode: TranslationMode
  target: TranslationTarget
  userId: string
}

const FIELD_TABLES = {
  assessments,
  courses,
  doc_articles: docArticles,
  doc_categories: docCategories,
  evaluations,
  lessons,
  question_options: questionOptions,
  questions,
  skill_groups: skillGroups,
} as const satisfies Record<FieldTable, Any>

export const sourceHashOf = (target: TranslationTarget) =>
  createHash('sha256').update(sourceFingerprint(target)).digest('hex')

export const saveTranslation = async (tx: Transaction, { locale, mode, target, userId }: SaveTranslation) => {
  const sourceHash = sourceHashOf(target)
  const base = {
    updatedAt: new Date().toISOString(),
    entityId: target.entityId,
    entityType: target.entityType,
    locale,
    reviewedById: mode === 'reviewed' ? userId : null,
    sourceHash,
    status: mode === 'edited' ? ('draft' as const) : mode,
    translatedById: userId,
  }
  const keep = mode === 'reviewed' ? { translatedById: undefined } : {}
  const keepHash = mode === 'edited' ? { sourceHash: undefined } : {}
  await tx
    .insert(contentTranslations)
    .values(base)
    .onConflictDoUpdate({
      set: { ...base, ...keep, ...keepHash },
      target: [contentTranslations.entityType, contentTranslations.entityId, contentTranslations.locale],
    })
}

export const writeFields = async (
  tx: Transaction,
  fields: Pick<TranslationField, 'column' | 'id' | 'table' | 'value'>[]
) => {
  await mapSequential(fields, ({ column, id, table, value }) => {
    const target = FIELD_TABLES[table] as Any
    return tx
      .update(target)
      .set({ [column]: value })
      .where(eq(target.id, id))
  })
}

export const deleteTranslations = async (tx: Transaction, entityType: ContentEntityType, ids: number[]) => {
  if (ids.length === 0) return
  await tx
    .delete(contentTranslations)
    .where(and(eq(contentTranslations.entityType, entityType), inArray(contentTranslations.entityId, ids)))
}
