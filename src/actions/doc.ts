'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache } from 'react'

import { asc, eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type DocCategory, parseDocArticle, parseDocCategory } from '@/db/queries/doc'
import { docArticles, docCategories } from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'

const articlesWith = {
  articles: {
    orderBy: [asc(docArticles.createdAt)],
  },
}

const publishedArticlesWith = {
  articles: {
    where: eq(docArticles.published, true),
    orderBy: [asc(docArticles.createdAt)],
  },
}

const requireEditor = async () => {
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')
  if (user.role !== 'admin' && !user.isEditor) throw new Error('Not authorized')
  return user
}

const fetchDocCategories = cache(async (includeUnpublished = false) => {
  'use cache'
  cacheTag(CacheTag.DocCategories)
  cacheLife('max')

  return await safeQuery(async () => {
    const result = await db.query.docCategories.findMany({
      with: includeUnpublished ? articlesWith : publishedArticlesWith,
      orderBy: [asc(docCategories.createdAt)],
    })
    return result.map(parseDocCategory)
  })
})

export const listDocCategories = async ({ cache = true, includeUnpublished = false } = {}): Promise<{
  data: DocCategory[] | null
  error: unknown
}> => {
  if (!cache) {
    const result = await db.query.docCategories.findMany({
      with: includeUnpublished ? articlesWith : publishedArticlesWith,
      orderBy: [asc(docCategories.createdAt)],
    })
    return { data: result.map(parseDocCategory), error: null }
  }
  return await fetchDocCategories(includeUnpublished)
}

export const findDocCategory = async (slug: string, { includeUnpublished = false } = {}) => {
  const result = await db.query.docCategories.findFirst({
    where: eq(docCategories.slug, slug),
    with: includeUnpublished ? articlesWith : publishedArticlesWith,
  })
  if (!result) return null
  return parseDocCategory(result)
}

export const createDocCategory = async (data: TableInsert<'doc_categories'>) => {
  try {
    await requireEditor()
    const [result] = await db.insert(docCategories).values(data).returning()
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
    const [result] = await db.insert(docArticles).values(data).returning()
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
    const [result] = await db.update(docArticles).set(data).where(eq(docArticles.id, id)).returning()
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
