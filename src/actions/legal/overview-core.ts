import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { desc, eq } from 'drizzle-orm'

import { legalAction } from '@/actions/legal/helpers'
import { getViewer } from '@/actions/viewer'
import { db } from '@/db/client'
import { hashLegalText, legalError } from '@/db/mutations/legal'
import { type LegalDocumentRow, type LegalVersionRow } from '@/db/queries/legal'
import { legalDocuments, legalTranslations, legalVersions, users } from '@/db/schema'
import { CacheTag, legalTag } from '@/lib/cache'
import { LEGAL_DOCUMENTS } from '@/lib/constants'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { fullName } from '@/lib/utils'

const queryLegalOverview = async (): Promise<LegalDocumentRow[]> => {
  const [documents, versions, translations] = await Promise.all([
    db.select().from(legalDocuments),
    db
      .select({
        changeNote: legalVersions.changeNote,
        documentSlug: legalVersions.documentSlug,
        effectiveAt: legalVersions.effectiveAt,
        firstName: users.firstName,
        id: legalVersions.id,
        lastName: users.lastName,
        material: legalVersions.material,
        publishedAt: legalVersions.publishedAt,
        status: legalVersions.status,
        version: legalVersions.version,
      })
      .from(legalVersions)
      .leftJoin(users, eq(users.id, legalVersions.publishedById))
      .orderBy(desc(legalVersions.version)),
    db.select().from(legalTranslations),
  ])

  return LEGAL_DOCUMENTS.map(slug => {
    const document = documents.find(row => row.slug === slug)
    const rows = versions.flatMap(({ documentSlug, firstName, lastName, ...version }): LegalVersionRow[] => {
      if (documentSlug !== slug) return []
      const own = translations.filter(translation => translation.versionId === version.id)
      const english = own.find(translation => translation.locale === DEFAULT_LOCALE)
      const englishHash = english ? hashLegalText(english.body) : null
      return [
        {
          ...version,
          publishedBy: fullName({ firstName, lastName }) || null,
          translations: own.map(({ body, locale, sourceHash, status, title, updatedAt }) => ({
            body,
            locale,
            outdated: locale !== DEFAULT_LOCALE && englishHash !== null && sourceHash !== englishHash,
            status,
            title,
            updatedAt,
          })),
        },
      ]
    })
    return {
      currentVersionId: document?.currentVersionId ?? null,
      draft: rows.find(version => version.status === 'draft') ?? null,
      requiresAcceptance: document?.requiresAcceptance ?? slug === 'terms',
      slug,
      versions: rows.filter(version => version.status !== 'draft'),
    }
  })
}

const readLegalOverview = async () => {
  'use cache'
  cacheTag(CacheTag.LegalAdmin, ...LEGAL_DOCUMENTS.map(legalTag))
  cacheLife({ stale: 60, revalidate: 900, expire: 86_400 })

  return await queryLegalOverview()
}

export const loadLegalOverview = async () =>
  await legalAction(async () => {
    const user = await getViewer()
    if (!user.canEdit) throw legalError('FORBIDDEN')
    return await readLegalOverview()
  })
