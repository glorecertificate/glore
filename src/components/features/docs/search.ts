import { type Locale } from 'next-intl'

import { type DocCategory } from '@/db/queries/doc'
import { pickLocale } from '@/db/queries/learning'

export interface DocSearchEntry {
  articleId: number
  categoryTitle: string
  excerpt: string | null
  haystack: string
  href: `/docs/articles/${string}`
  slug: string
  title: string
}

export interface DocSearchResult extends Omit<DocSearchEntry, 'haystack'> {
  score: number
}

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/[#*_`>~|-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()

export const buildDocIndex = (categories: DocCategory[], locale: Locale): DocSearchEntry[] =>
  categories.flatMap(category => {
    const categoryTitle = pickLocale(category.title, locale) ?? category.slug
    return category.articles.map(article => {
      const title = pickLocale(article.title, locale) ?? article.slug
      const excerpt = pickLocale(article.excerpt, locale)
      const content = stripMarkdown(pickLocale(article.content, locale) ?? '')
      return {
        articleId: article.id,
        categoryTitle,
        excerpt,
        haystack: [title, excerpt ?? '', categoryTitle, content].join(' ').toLowerCase(),
        href: `/docs/articles/${article.slug}` as const,
        slug: article.slug,
        title,
      }
    })
  })

export const searchDocs = (index: DocSearchEntry[], query: string, limit = 8): DocSearchResult[] => {
  const terms = query.toLowerCase().split(/\s+/u).filter(Boolean)
  if (terms.length === 0) return []

  const scored = index.reduce<DocSearchResult[]>((results, { haystack, ...entry }) => {
    if (!terms.every(term => haystack.includes(term))) return results
    const title = entry.title.toLowerCase()
    const excerpt = (entry.excerpt ?? '').toLowerCase()
    const score = terms.reduce(
      (sum, term) =>
        sum + 1 + (title.includes(term) ? 6 : 0) + (title.startsWith(term) ? 2 : 0) + (excerpt.includes(term) ? 3 : 0),
      0
    )
    results.push({ ...entry, score })
    return results
  }, [])

  return scored.toSorted((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit)
}
