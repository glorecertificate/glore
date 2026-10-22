import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { type Locale } from 'next-intl'
import { parse } from 'yaml'
import { z } from 'zod'

import { DEFAULT_LOCALE } from '@/lib/i18n'

const LEGAL_DOCUMENTS = ['privacy', 'terms', 'quality-charter'] as const

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number]

interface LegalContent {
  body: string
  locale: Locale
  title: string
  updated: string | null
}

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u

const frontMatterSchema = z.object({
  title: z.string().min(1),
  updated: z.union([z.string(), z.date()]).nullable().optional(),
})

const legalRoot = () => path.join(process.cwd(), 'content', 'legal')

export const parseLegalFile = (source: string) => {
  const match = FRONT_MATTER_REGEX.exec(source)
  if (!match) return null

  const parsed = frontMatterSchema.safeParse(parse(match[1] ?? ''))
  if (!parsed.success) return null

  const { title, updated } = parsed.data
  const date = updated instanceof Date ? updated.toISOString().slice(0, 10) : (updated ?? null)
  return { body: (match[2] ?? '').trim(), title, updated: date }
}

const readLegalFile = async (root: string, document: LegalDocument, locale: Locale) => {
  try {
    return parseLegalFile(await readFile(path.join(root, `${document}.${locale}.md`), 'utf8'))
  } catch {
    return null
  }
}

export const loadLegalDocument = async (document: LegalDocument, locale: Locale, root = legalRoot()) => {
  const candidates = locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE]
  const results = await Promise.all(candidates.map(candidate => readLegalFile(root, document, candidate)))
  const index = results.findIndex(Boolean)
  const content = results[index]
  const resolved = candidates[index]
  if (!(content && resolved)) return null
  return { ...content, locale: resolved } satisfies LegalContent
}
