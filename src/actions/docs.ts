'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { fetchDocCategories, queryDocCategories } from '@/actions/docs-core'
import { isEditorUser, requireEditor } from '@/actions/guards'
import { markEdited } from '@/actions/translations/effects'
import { db, transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { deleteTranslations } from '@/db/mutations/content-translation'
import { TARGET_LOCALES, articleTarget, changedLocales, languageChanges } from '@/db/queries/content-translation'
import { type DocCategory, parseDocArticle } from '@/db/queries/doc'
import { docArticles, docCategories } from '@/db/schema'
import { docArticleInsertSchema, docArticleUpdateSchema, docCategoryInsertSchema } from '@/db/schemas'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'

export const listDocCategories = async ({ cache: useCache = true, includeUnpublished = false } = {}): Promise<{
  data: DocCategory[] | null
  error: unknown
}> => {
  const withUnpublished = includeUnpublished && isEditorUser(await getAuthUser())
  if (!useCache) return { data: await queryDocCategories(withUnpublished), error: null }
  return await fetchDocCategories(withUnpublished)
}

export const createDocCategory = async (data: TableInsert<'doc_categories'>) => {
  try {
    await requireEditor()
    const parsed = docCategoryInsertSchema.safeParse(data)
    if (!parsed.success) return { data: null, error: { code: 'VALIDATION', message: 'Invalid category data' } }
    const [result] = await db.insert(docCategories).values(parsed.data).returning()
    updateTag(CacheTag.DocCategories)
    return { data: result, error: null }
  } catch (e) {
    return {
      data: null,
      error: { code: 'ERROR', message: e instanceof Error ? e.message : 'Failed to create category' },
    }
  }
}

export const deleteDocCategory = async (id: number) => {
  try {
    await requireEditor()
    await transaction(async tx => {
      await tx.delete(docCategories).where(eq(docCategories.id, id))
      await deleteTranslations(tx, 'doc_category', [id])
    })
    updateTag(CacheTag.DocCategories)
    return { error: null }
  } catch (e) {
    return { error: { code: 'ERROR', message: e instanceof Error ? e.message : 'Failed to delete category' } }
  }
}

export const createDocArticle = async (data: TableInsert<'doc_articles'>) => {
  try {
    await requireEditor()
    const parsed = docArticleInsertSchema.safeParse(data)
    if (!parsed.success) return { data: null, error: { code: 'VALIDATION', message: 'Invalid article data' } }
    const [result] = await db.insert(docArticles).values(parsed.data).returning()
    updateTag(CacheTag.DocCategories)
    return { data: parseDocArticle(result), error: null }
  } catch (e) {
    return {
      data: null,
      error: { code: 'ERROR', message: e instanceof Error ? e.message : 'Failed to create article' },
    }
  }
}

export const updateDocArticle = async (id: number, data: TableUpdate<'doc_articles'>) => {
  try {
    const user = await requireEditor()
    const parsed = docArticleUpdateSchema.safeParse(data)
    if (!parsed.success) return { data: null, error: { code: 'VALIDATION', message: 'Invalid article data' } }
    const existing = await db.query.docArticles.findFirst({ where: eq(docArticles.id, id) })
    if (!existing) return { data: null, error: { code: 'NOT_FOUND', message: 'Article not found' } }

    const result = await transaction(async tx => {
      const [updated] = await tx.update(docArticles).set(parsed.data).where(eq(docArticles.id, id)).returning()
      if (!updated) return null
      const edited = TARGET_LOCALES.filter(locale =>
        [
          changedLocales(existing.title, updated.title),
          changedLocales(existing.excerpt, updated.excerpt),
          changedLocales(existing.content, updated.content),
        ].some(locales => locales.includes(locale))
      )
      await mapSequential(edited, locale => markEdited(tx, [articleTarget(updated)], locale, user.id))
      await mapSequential(languageChanges(existing.languages, updated.languages), ({ locale, published }) =>
        recordEvent(tx, {
          actorId: user.id,
          data: { entityId: id, entityType: 'doc_article', locale, published, slug: updated.slug },
          organizationId: null,
          type: 'doc.locale_published',
        })
      )
      return updated
    })
    if (!result) return { data: null, error: { code: 'NOT_FOUND', message: 'Article not found' } }
    updateTag(CacheTag.DocCategories)
    updateTag(CacheTag.ContentTranslations)
    return { data: parseDocArticle(result), error: null }
  } catch (e) {
    return {
      data: null,
      error: { code: 'ERROR', message: e instanceof Error ? e.message : 'Failed to update article' },
    }
  }
}

export const deleteDocArticle = async (id: number) => {
  try {
    await requireEditor()
    await transaction(async tx => {
      await tx.delete(docArticles).where(eq(docArticles.id, id))
      await deleteTranslations(tx, 'doc_article', [id])
    })
    updateTag(CacheTag.DocCategories)
    return { error: null }
  } catch (e) {
    return { error: { code: 'ERROR', message: e instanceof Error ? e.message : 'Failed to delete article' } }
  }
}
