import { z } from 'zod'

import { LEGAL_DOCUMENTS } from '@/lib/constants'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number]

export const isLegalDocument = (value: unknown): value is LegalDocument =>
  typeof value === 'string' && (LEGAL_DOCUMENTS as readonly string[]).includes(value)

const LEGAL_ERROR_CODES = [
  'DRAFT_EXISTS',
  'FORBIDDEN',
  'HEADINGS_DIFFER',
  'INCOMPLETE',
  'INVALID_INPUT',
  'NOT_DRAFT',
  'NOT_FOUND',
  'RATE_LIMITED',
  'UNAUTHORIZED',
] as const

export type LegalErrorCode = (typeof LEGAL_ERROR_CODES)[number]

export const isKnownLegalErrorCode = (code: string | null | undefined): code is LegalErrorCode =>
  (LEGAL_ERROR_CODES as readonly string[]).includes(code ?? '')

const HEADING_REGEX = /^(#{1,6})\s/gmu

export const headingShape = (body: string) =>
  [...body.matchAll(HEADING_REGEX)].map(([, hashes]) => hashes?.length).join('')

export const headingMismatches = (translations: { body: string; locale: string }[], source = DEFAULT_LOCALE) => {
  const expected = translations.find(({ locale }) => locale === source)
  if (!expected) return []
  const shape = headingShape(expected.body)
  return translations.flatMap(({ body, locale }) => (locale !== source && headingShape(body) !== shape ? [locale] : []))
}

export const legalTranslationInputSchema = z.object({
  body: z.string().trim().min(1).max(100_000),
  locale: z.enum(LOCALES),
  title: z.string().trim().min(1).max(200),
  versionId: z.number().int().positive(),
})

export type LegalTranslationInput = z.input<typeof legalTranslationInputSchema>

export const legalPublishInputSchema = z.object({
  changeNote: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform(value => value || null),
  effectiveAt: z.iso.date(),
  material: z.boolean(),
  versionId: z.number().int().positive(),
})

export type LegalPublishInput = z.input<typeof legalPublishInputSchema>

export const legalDraftInputSchema = z.object({ slug: z.enum(LEGAL_DOCUMENTS) })

export const legalVersionInputSchema = z.object({ versionId: z.number().int().positive() })

interface LegalTranslationRow {
  body: string
  locale: string
  outdated: boolean
  status: 'draft' | 'machine' | 'reviewed'
  title: string
  updatedAt: string
}

export interface LegalVersionRow {
  changeNote: string | null
  effectiveAt: string | null
  id: number
  material: boolean
  publishedAt: string | null
  publishedBy: string | null
  status: 'draft' | 'published' | 'superseded'
  translations: LegalTranslationRow[]
  version: number
}

export interface LegalDocumentRow {
  currentVersionId: number | null
  draft: LegalVersionRow | null
  requiresAcceptance: boolean
  slug: LegalDocument
  versions: LegalVersionRow[]
}

export interface PendingLegal {
  slug: LegalDocument
  version: number
  versionId: number
}

interface AcceptanceDocument {
  currentVersion: number | null
  currentVersionId: number | null
  materialVersion: number | null
  slug: LegalDocument
}

export const pendingAcceptance = (
  documents: AcceptanceDocument[],
  accepted: { slug: string; version: number }[]
): PendingLegal | null => {
  for (const { currentVersion, currentVersionId, materialVersion, slug } of documents) {
    if (!(currentVersion && currentVersionId && materialVersion)) continue
    const satisfied = accepted.some(entry => entry.slug === slug && entry.version >= materialVersion)
    if (!satisfied) return { slug, version: currentVersion, versionId: currentVersionId }
  }
  return null
}
