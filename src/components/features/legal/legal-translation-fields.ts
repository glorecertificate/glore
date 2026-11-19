import { type Value } from 'platejs'

import { articleValueToMarkdown, markdownToArticleValue } from '@/components/features/docs/article-markdown'
import { hasText } from '@/lib/translate'

export interface LegalValues {
  body: string
  title: string
}

export type LegalField = 'body' | 'title'

export const LEGAL_FIELDS: LegalField[] = ['title', 'body']

const legalFieldKey = (field: LegalField) => `legal_translations:draft:${field}`

export const parseLegalFieldKey = (key: string) => LEGAL_FIELDS.find(field => legalFieldKey(field) === key)

export const legalSources = (
  values: Record<string, LegalValues>,
  fields: LegalField[],
  locales: readonly string[],
  exclude: string
) => locales.filter(locale => locale !== exclude && fields.some(field => hasText(values[locale]?.[field])))

interface PlanInput {
  fields: LegalField[]
  source: string
  target: string
  values: Record<string, LegalValues>
}

export const planLegalTranslation = ({ fields, source, target, values }: PlanInput) => {
  const seen = new Map<string, string>()
  const requested = fields.flatMap(field => {
    const text = values[source]?.[field] ?? ''
    if (!hasText(text)) return []
    const key = legalFieldKey(field)
    const current = values[target]?.[field] ?? ''
    seen.set(key, current)
    return [
      {
        existing: { [target]: hasText(current) },
        key,
        text: field === 'body' ? markdownToArticleValue(text) : text,
      },
    ]
  })
  return { fields: requested, seen }
}

export const legalValueOf = (field: LegalField, value: unknown) =>
  field === 'body' ? articleValueToMarkdown(value as Value) : String(value)
