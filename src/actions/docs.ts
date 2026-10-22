'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache } from 'react'

import { asc, eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { isEditorUser, requireEditor } from '@/actions/guards'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type DocCategory, parseDocArticle, parseDocCategory } from '@/db/queries/doc'
import { docArticles, docCategories } from '@/db/schema'
import { docArticleInsertSchema, docArticleUpdateSchema, docCategoryInsertSchema } from '@/db/schemas'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'
import { type IntlRecord } from '@/lib/i18n'

const getArticlesWith = () => ({
  articles: {
    orderBy: [asc(docArticles.createdAt)],
  },
})

const getPublishedArticlesWith = () => ({
  articles: {
    where: eq(docArticles.published, true),
    orderBy: [asc(docArticles.createdAt)],
  },
})

const queryDocCategories = async (includeUnpublished: boolean) => {
  const result = await db.query.docCategories.findMany({
    with: includeUnpublished ? getArticlesWith() : getPublishedArticlesWith(),
    orderBy: [asc(docCategories.createdAt)],
    limit: 100,
  })
  return result.map(parseDocCategory)
}

const fetchDocCategories = cache(async (includeUnpublished = false) => {
  'use cache'
  cacheTag(CacheTag.DocCategories)
  cacheLife('max')

  return await safeQuery(() => queryDocCategories(includeUnpublished))
})

export const listDocCategories = async ({ cache: useCache = true, includeUnpublished = false } = {}): Promise<{
  data: DocCategory[] | null
  error: unknown
}> => {
  const withUnpublished = includeUnpublished && isEditorUser(await getAuthUser())
  if (!useCache) return { data: await queryDocCategories(withUnpublished), error: null }
  return await fetchDocCategories(withUnpublished)
}

export const findDocCategory = async (slug: string, { includeUnpublished = false } = {}) => {
  const withUnpublished = includeUnpublished && isEditorUser(await getAuthUser())
  const result = await db.query.docCategories.findFirst({
    where: eq(docCategories.slug, slug),
    with: withUnpublished ? getArticlesWith() : getPublishedArticlesWith(),
  })
  if (!result) return null
  return parseDocCategory(result)
}

export const findDocArticle = async (slug: string) => {
  const withDrafts = isEditorUser(await getAuthUser())
  const row = await db.query.docArticles.findFirst({
    where: eq(docArticles.slug, slug),
    with: { category: true },
  })
  if (!row || (!row.published && !withDrafts)) return null

  const { category, ...article } = row
  const siblings = row.categoryId
    ? await db.query.docArticles.findMany({
        columns: { id: true, published: true, slug: true, title: true },
        orderBy: [asc(docArticles.createdAt)],
        where: eq(docArticles.categoryId, row.categoryId),
      })
    : []
  return {
    article: parseDocArticle(article),
    category,
    siblings: siblings.reduce<{ slug: string; title: IntlRecord }[]>((list, sibling) => {
      if (sibling.published || withDrafts) list.push({ slug: sibling.slug, title: sibling.title })
      return list
    }, []),
  }
}

export const createDocCategory = async (data: TableInsert<'doc_categories'>) => {
  try {
    await requireEditor()
    const parsed = docCategoryInsertSchema.safeParse(data)
    if (!parsed.success) return { data: null, error: { code: 'VALIDATION', message: 'Invalid category data' } }
    const [result] = await db.insert(docCategories).values(parsed.data).returning()
    revalidateTag(CacheTag.DocCategories, 'max')
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
    await db.delete(docCategories).where(eq(docCategories.id, id))
    revalidateTag(CacheTag.DocCategories, 'max')
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
    revalidateTag(CacheTag.DocCategories, 'max')
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
    await requireEditor()
    const parsed = docArticleUpdateSchema.safeParse(data)
    if (!parsed.success) return { data: null, error: { code: 'VALIDATION', message: 'Invalid article data' } }
    const [result] = await db.update(docArticles).set(parsed.data).where(eq(docArticles.id, id)).returning()
    if (!result) return { data: null, error: { code: 'NOT_FOUND', message: 'Article not found' } }
    revalidateTag(CacheTag.DocCategories, 'max')
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
    await db.delete(docArticles).where(eq(docArticles.id, id))
    revalidateTag(CacheTag.DocCategories, 'max')
    return { error: null }
  } catch (e) {
    return { error: { code: 'ERROR', message: e instanceof Error ? e.message : 'Failed to delete article' } }
  }
}
