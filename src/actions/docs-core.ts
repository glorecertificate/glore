import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { asc, eq } from 'drizzle-orm'

import { isEditorUser } from '@/actions/guards'
import { getSessionUser } from '@/actions/session'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { isPublicArticle, parseDocArticle, parseDocCategory, redactArticle } from '@/db/queries/doc'
import { docArticles, docCategories } from '@/db/schema'
import { CacheTag, LIVE_LIFE } from '@/lib/cache'
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

export const queryDocCategories = async (includeUnpublished: boolean) => {
  const result = await db.query.docCategories.findMany({
    with: includeUnpublished ? getArticlesWith() : getPublishedArticlesWith(),
    orderBy: [asc(docCategories.createdAt)],
    limit: 100,
  })
  const categories = result.map(parseDocCategory)
  if (includeUnpublished) return categories
  return categories.map(category => ({
    ...category,
    articles: category.articles.flatMap(article => (isPublicArticle(article) ? [redactArticle(article)] : [])),
  }))
}

export const fetchDocCategories = cache(async (includeUnpublished = false) => {
  'use cache'
  cacheTag(CacheTag.DocCategories)
  cacheLife('max')

  return await safeQuery(() => queryDocCategories(includeUnpublished))
})

const queryDocArticle = async (slug: string, withDrafts: boolean) => {
  const row = await db.query.docArticles.findFirst({
    where: eq(docArticles.slug, slug),
    with: { category: true },
  })
  if (!row || (!isPublicArticle(row) && !withDrafts)) return null

  const { category, ...rawArticle } = row
  const article = withDrafts ? rawArticle : redactArticle(rawArticle)
  const siblings = row.categoryId
    ? await db.query.docArticles.findMany({
        columns: { id: true, languages: true, published: true, slug: true, title: true },
        orderBy: [asc(docArticles.createdAt)],
        where: eq(docArticles.categoryId, row.categoryId),
      })
    : []
  return {
    article: parseDocArticle(article),
    category,
    siblings: siblings.reduce<{ slug: string; title: IntlRecord }[]>((list, sibling) => {
      if (withDrafts) {
        list.push({ slug: sibling.slug, title: sibling.title })
        return list
      }
      if (isPublicArticle(sibling)) list.push({ slug: sibling.slug, title: redactArticle(sibling).title })
      return list
    }, []),
  }
}

const fetchDocArticle = cache(async (slug: string, withDrafts: boolean) => {
  'use cache'
  cacheTag(CacheTag.DocCategories)
  cacheLife(LIVE_LIFE)

  return await queryDocArticle(slug, withDrafts)
})

export const getDocEditor = async () => {
  const session = await getSessionUser()
  return isEditorUser(session)
}

export const loadDocCategories = async () => await fetchDocCategories(await getDocEditor())

export const loadDocArticle = async (slug: string) => await fetchDocArticle(slug, await getDocEditor())
