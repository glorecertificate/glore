import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { eq } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { db } from '@/db/client'
import { queryPendingLegal } from '@/db/mutations/legal'
import { type LegalDocument, type PendingLegal } from '@/db/queries/legal'
import { legalDocuments, legalTranslations, legalVersions } from '@/db/schema'
import { legalTag, userTag } from '@/lib/cache'
import { LEGAL_DOCUMENTS } from '@/lib/constants'
import { DEFAULT_LOCALE } from '@/lib/i18n'

interface LegalContent {
  body: string
  effectiveAt: string | null
  locale: Locale
  material: boolean
  title: string
  version: number
  versionId: number
}

interface CurrentLegal {
  effectiveAt: string | null
  id: number
  material: boolean
  translations: Record<string, { body: string; title: string }>
  version: number
}

const queryCurrentLegal = async (slug: LegalDocument): Promise<CurrentLegal | null> => {
  const [current] = await db
    .select({
      effectiveAt: legalVersions.effectiveAt,
      id: legalVersions.id,
      material: legalVersions.material,
      version: legalVersions.version,
    })
    .from(legalDocuments)
    .innerJoin(legalVersions, eq(legalVersions.id, legalDocuments.currentVersionId))
    .where(eq(legalDocuments.slug, slug))
  if (!current) return null

  const rows = await db
    .select({ body: legalTranslations.body, locale: legalTranslations.locale, title: legalTranslations.title })
    .from(legalTranslations)
    .where(eq(legalTranslations.versionId, current.id))
  return {
    ...current,
    translations: Object.fromEntries(rows.map(({ body, locale, title }) => [locale, { body, title }])),
  }
}

const fetchCurrentLegal = async (slug: LegalDocument) => {
  'use cache'
  cacheTag(legalTag(slug))
  cacheLife('max')

  return await queryCurrentLegal(slug)
}

export const loadLegalDocument = async (
  slug: LegalDocument,
  locale: Locale,
  { cache = true }: { cache?: boolean } = {}
) => {
  const current = cache ? await fetchCurrentLegal(slug) : await queryCurrentLegal(slug)
  if (!current) return null

  const candidates = locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE]
  const resolved = candidates.find(candidate => current.translations[candidate])
  const translation = resolved ? current.translations[resolved] : null
  if (!(resolved && translation)) return null

  return {
    body: translation.body,
    effectiveAt: current.effectiveAt,
    locale: resolved,
    material: current.material,
    title: translation.title,
    version: current.version,
    versionId: current.id,
  } satisfies LegalContent
}

const fetchPendingLegal = async (userId: string): Promise<PendingLegal | null> => {
  'use cache'
  cacheTag(userTag(userId), ...LEGAL_DOCUMENTS.map(legalTag))
  cacheLife('max')

  return await queryPendingLegal(userId)
}

export const getPendingLegal = async (userId: string, { cache = true }: { cache?: boolean } = {}) =>
  cache ? await fetchPendingLegal(userId) : await queryPendingLegal(userId)
