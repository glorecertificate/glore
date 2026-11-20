import { type Value } from 'platejs'

import { type ArticleDraft } from '@/components/features/docs/article-editor/payload'
import { articleValueToMarkdown, markdownToArticleValue } from '@/components/features/docs/article-markdown'
import { hasText } from '@/lib/translate'

export type ArticleField = 'content' | 'excerpt' | 'title'

export const ARTICLE_FIELDS: ArticleField[] = ['title', 'excerpt', 'content']

const SLOTS = { content: 'contents', excerpt: 'excerpts', title: 'titles' } as const

const articleFieldKey = (field: ArticleField) => `doc_articles:draft:${field}`

export const parseArticleFieldKey = (key: string) => ARTICLE_FIELDS.find(field => articleFieldKey(field) === key)

export const readArticleField = (draft: ArticleDraft, field: ArticleField, locale: string) =>
  draft[SLOTS[field]][locale as keyof ArticleDraft['titles']] ?? ''

export const articleSlot = (field: ArticleField) => SLOTS[field]

export const articleSources = (
  draft: ArticleDraft,
  fields: ArticleField[],
  locales: readonly string[],
  exclude: string
) =>
  locales.filter(locale => locale !== exclude && fields.some(field => hasText(readArticleField(draft, field, locale))))

interface PlanInput {
  draft: ArticleDraft
  fields: ArticleField[]
  source: string
  target: string
}

export const planArticleTranslation = ({ draft, fields, source, target }: PlanInput) => {
  const seen = new Map<string, string>()
  const requested = fields.flatMap(field => {
    const text = readArticleField(draft, field, source)
    if (!hasText(text)) return []
    const key = articleFieldKey(field)
    const current = readArticleField(draft, field, target)
    seen.set(key, current)
    return [
      {
        existing: { [target]: hasText(current) },
        key,
        text: field === 'content' ? markdownToArticleValue(text) : text,
      },
    ]
  })
  return { fields: requested, seen }
}

export const articleValueOf = (field: ArticleField, value: unknown) =>
  field === 'content' ? articleValueToMarkdown(value as Value) : String(value)
