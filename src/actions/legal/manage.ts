'use server'

import 'server-only'

import { desc, eq } from 'drizzle-orm'

import {
  expireLegal,
  legalAction,
  readLegalEditor,
  requireLegalAdmin,
  requireLegalEditor,
} from '@/actions/legal/helpers'
import { db, transaction } from '@/db/client'
import {
  createLegalDraft,
  discardLegalDraft,
  hashLegalText,
  legalError,
  publishLegalVersion,
  saveLegalTranslation,
} from '@/db/mutations/legal'
import {
  type LegalDocumentRow,
  type LegalPublishInput,
  type LegalTranslationInput,
  type LegalVersionRow,
  legalDraftInputSchema,
  legalPublishInputSchema,
  legalTranslationInputSchema,
  legalVersionInputSchema,
} from '@/db/queries/legal'
import { legalDocuments, legalTranslations, legalVersions, users } from '@/db/schema'
import { LEGAL_DOCUMENTS } from '@/lib/constants'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { fullName } from '@/lib/utils'

const LEGAL_WRITES_PER_HOUR = 200
const LEGAL_PUBLISHES_PER_HOUR = 20

export const getLegalOverview = async () =>
  await legalAction(async (): Promise<LegalDocumentRow[]> => {
    await readLegalEditor()
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
  })

export const createDraft = async (input: { slug: string }) =>
  await legalAction(async () => {
    const parsed = legalDraftInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    const user = await requireLegalEditor('draft', LEGAL_WRITES_PER_HOUR)
    const draft = await transaction(tx => createLegalDraft(tx, { actorId: user.id, slug: parsed.data.slug }))
    return { versionId: draft.id }
  })

export const saveTranslation = async (input: LegalTranslationInput) =>
  await legalAction(async () => {
    const parsed = legalTranslationInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    const user = await requireLegalEditor('translation', LEGAL_WRITES_PER_HOUR)
    await transaction(tx => saveLegalTranslation(tx, { ...parsed.data, actorId: user.id }))
    return null
  })

export const discardDraft = async (input: { versionId: number }) =>
  await legalAction(async () => {
    const parsed = legalVersionInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    await requireLegalEditor('discard', LEGAL_WRITES_PER_HOUR)
    await transaction(tx => discardLegalDraft(tx, parsed.data.versionId))
    return null
  })

export const publishVersion = async (input: LegalPublishInput) =>
  await legalAction(async () => {
    const parsed = legalPublishInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    const user = await requireLegalAdmin('publish', LEGAL_PUBLISHES_PER_HOUR)
    const { slug } = await transaction(tx => publishLegalVersion(tx, { ...parsed.data, actorId: user.id }))
    expireLegal(slug)
    return { slug }
  })
