import 'server-only'

import { createHash } from 'node:crypto'

import { and, desc, eq, inArray, max } from 'drizzle-orm'

import { type Transaction, db } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { type AppEvent } from '@/db/queries/activity-event'
import {
  type LegalDocument,
  type LegalErrorCode,
  headingMismatches,
  isLegalDocument,
  pendingAcceptance,
} from '@/db/queries/legal'
import { legalAcceptances, legalDocuments, legalTranslations, legalVersions } from '@/db/schema'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'

const LEGAL_ERROR_MESSAGES = {
  DRAFT_EXISTS: 'This document already has a draft',
  FORBIDDEN: 'Only platform admins can do this',
  HEADINGS_DIFFER: 'The headings of the translations differ from the English text',
  INCOMPLETE: 'Every language needs a title and a text',
  INVALID_INPUT: 'These values are not valid',
  NOT_DRAFT: 'Only a draft can be changed',
  NOT_FOUND: 'Version not found',
  RATE_LIMITED: 'Too many attempts. Try again later.',
  UNAUTHORIZED: 'Not authenticated',
} satisfies Record<LegalErrorCode, string>

export const legalError = (code: LegalErrorCode, locales: string[] = []) =>
  Object.assign(new Error(LEGAL_ERROR_MESSAGES[code]), { code, locales })

export const isLegalError = (error: unknown): error is Error & { code: LegalErrorCode; locales: string[] } =>
  error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code in LEGAL_ERROR_MESSAGES

export const hashLegalText = (text: string) => createHash('sha256').update(text).digest('hex')

const lockDocument = async (tx: Transaction, slug: LegalDocument) => {
  await tx
    .insert(legalDocuments)
    .values({ requiresAcceptance: slug === 'terms', slug })
    .onConflictDoNothing()
  const [document] = await tx.select().from(legalDocuments).where(eq(legalDocuments.slug, slug)).for('update')
  if (!document) throw legalError('NOT_FOUND')
  return document
}

const lockVersion = async (tx: Transaction, versionId: number) => {
  const [version] = await tx.select().from(legalVersions).where(eq(legalVersions.id, versionId)).for('update')
  if (!version) throw legalError('NOT_FOUND')
  return version
}

const slugOf = async (tx: Transaction, versionId: number) => {
  const [row] = await tx
    .select({ slug: legalVersions.documentSlug })
    .from(legalVersions)
    .where(eq(legalVersions.id, versionId))
  if (!(row && isLegalDocument(row.slug))) throw legalError('NOT_FOUND')
  return row.slug
}

export const currentLegalVersionId = async (tx: Transaction, slug: LegalDocument) => {
  const [row] = await tx
    .select({ id: legalDocuments.currentVersionId })
    .from(legalDocuments)
    .where(eq(legalDocuments.slug, slug))
  return row?.id ?? null
}

export const createLegalDraft = async (
  tx: Transaction,
  { actorId, slug }: { actorId: string; slug: LegalDocument }
) => {
  const document = await lockDocument(tx, slug)
  const [existing] = await tx
    .select({ id: legalVersions.id })
    .from(legalVersions)
    .where(and(eq(legalVersions.documentSlug, slug), eq(legalVersions.status, 'draft')))
  if (existing) throw legalError('DRAFT_EXISTS')

  const [latest] = await tx
    .select({ version: legalVersions.version })
    .from(legalVersions)
    .where(eq(legalVersions.documentSlug, slug))
    .orderBy(desc(legalVersions.version))
    .limit(1)
  const [draft] = await tx
    .insert(legalVersions)
    .values({ createdById: actorId, documentSlug: slug, status: 'draft', version: (latest?.version ?? 0) + 1 })
    .returning()
  if (!draft) throw new Error('Failed to create the draft')

  if (!document.currentVersionId) return draft

  const source = await tx
    .select()
    .from(legalTranslations)
    .where(eq(legalTranslations.versionId, document.currentVersionId))
  const english = source.find(({ locale }) => locale === DEFAULT_LOCALE)
  for (const { body, locale, title } of source) {
    await tx.insert(legalTranslations).values({
      body,
      locale,
      sourceHash: locale !== DEFAULT_LOCALE && english ? hashLegalText(english.body) : null,
      status: 'draft',
      title,
      updatedById: actorId,
      versionId: draft.id,
    })
  }
  return draft
}

export const saveLegalTranslation = async (
  tx: Transaction,
  {
    actorId,
    body,
    locale,
    title,
    versionId,
  }: { actorId: string; body: string; locale: string; title: string; versionId: number }
) => {
  const version = await lockVersion(tx, versionId)
  if (version.status !== 'draft') throw legalError('NOT_DRAFT')

  let sourceHash: string | null = null
  if (locale !== DEFAULT_LOCALE) {
    const [english] = await tx
      .select({ body: legalTranslations.body })
      .from(legalTranslations)
      .where(and(eq(legalTranslations.versionId, versionId), eq(legalTranslations.locale, DEFAULT_LOCALE)))
    sourceHash = english ? hashLegalText(english.body) : null
  }

  const values = {
    body,
    reviewedById: null,
    sourceHash,
    status: 'draft',
    title,
    updatedAt: new Date().toISOString(),
    updatedById: actorId,
  } as const
  await tx
    .insert(legalTranslations)
    .values({ ...values, locale, versionId })
    .onConflictDoUpdate({ set: values, target: [legalTranslations.versionId, legalTranslations.locale] })
  return version.documentSlug
}

export const discardLegalDraft = async (tx: Transaction, versionId: number) => {
  const slug = await slugOf(tx, versionId)
  const version = await lockVersion(tx, versionId)
  if (version.status !== 'draft') throw legalError('NOT_DRAFT')
  await tx.delete(legalVersions).where(eq(legalVersions.id, versionId))
  return slug
}

export const publishLegalVersion = async (
  tx: Transaction,
  {
    actorId,
    changeNote,
    effectiveAt,
    material,
    versionId,
  }: { actorId: string; changeNote: string | null; effectiveAt: string; material: boolean; versionId: number }
) => {
  const slug = await slugOf(tx, versionId)
  const document = await lockDocument(tx, slug)
  const version = await lockVersion(tx, versionId)
  if (version.status !== 'draft') throw legalError('NOT_DRAFT')

  const translations = await tx.select().from(legalTranslations).where(eq(legalTranslations.versionId, versionId))
  const incomplete = LOCALES.filter(
    locale => !translations.some(row => row.locale === locale && row.title.trim() !== '' && row.body.trim() !== '')
  )
  if (incomplete.length > 0) throw legalError('INCOMPLETE', incomplete)
  const mismatched = headingMismatches(translations)
  if (mismatched.length > 0) throw legalError('HEADINGS_DIFFER', mismatched)

  if (document.currentVersionId) {
    await tx
      .update(legalVersions)
      .set({ status: 'superseded' })
      .where(and(eq(legalVersions.id, document.currentVersionId), eq(legalVersions.status, 'published')))
  }

  const now = new Date().toISOString()
  const isMaterial = document.requiresAcceptance && material
  await tx
    .update(legalVersions)
    .set({
      changeNote,
      effectiveAt,
      material: isMaterial,
      publishedAt: now,
      publishedById: actorId,
      status: 'published',
    })
    .where(eq(legalVersions.id, versionId))
  await tx
    .update(legalTranslations)
    .set({ reviewedById: actorId, status: 'reviewed' })
    .where(eq(legalTranslations.versionId, versionId))
  await tx.update(legalDocuments).set({ currentVersionId: versionId }).where(eq(legalDocuments.slug, slug))

  const event = {
    actorId,
    data: { effectiveAt, material: isMaterial, slug, version: version.version, versionId },
    organizationId: null,
    type: 'legal.version_published',
  } satisfies AppEvent<'legal.version_published'>
  await recordEvent(tx, event)
  return { event, slug }
}

export const acceptCurrentLegal = async (tx: Transaction, { locale, userId }: { locale: string; userId: string }) => {
  const documents = await tx
    .select({
      slug: legalDocuments.slug,
      version: legalVersions.version,
      versionId: legalVersions.id,
    })
    .from(legalDocuments)
    .innerJoin(legalVersions, eq(legalVersions.id, legalDocuments.currentVersionId))
    .where(eq(legalDocuments.requiresAcceptance, true))

  const events: AppEvent<'legal.accepted'>[] = []
  for (const { slug, version, versionId } of documents) {
    const [row] = await tx
      .insert(legalAcceptances)
      .values({ locale, userId, versionId })
      .onConflictDoNothing()
      .returning({ id: legalAcceptances.id })
    if (!row) continue
    const event = {
      actorId: userId,
      data: { slug, userId, version, versionId },
      organizationId: null,
      type: 'legal.accepted',
    } satisfies AppEvent<'legal.accepted'>
    await recordEvent(tx, event)
    events.push(event)
  }
  return events
}

export const queryPendingLegal = async (userId: string, executor: typeof db = db) => {
  const documents = await executor
    .select({
      currentVersion: legalVersions.version,
      currentVersionId: legalDocuments.currentVersionId,
      slug: legalDocuments.slug,
    })
    .from(legalDocuments)
    .innerJoin(legalVersions, eq(legalVersions.id, legalDocuments.currentVersionId))
    .where(eq(legalDocuments.requiresAcceptance, true))
  if (documents.length === 0) return null

  const slugs = documents.map(({ slug }) => slug)
  const [materials, accepted] = await Promise.all([
    executor
      .select({ slug: legalVersions.documentSlug, version: max(legalVersions.version) })
      .from(legalVersions)
      .where(
        and(
          inArray(legalVersions.documentSlug, slugs),
          eq(legalVersions.material, true),
          inArray(legalVersions.status, ['published', 'superseded'])
        )
      )
      .groupBy(legalVersions.documentSlug),
    executor
      .select({ slug: legalVersions.documentSlug, version: legalVersions.version })
      .from(legalAcceptances)
      .innerJoin(legalVersions, eq(legalVersions.id, legalAcceptances.versionId))
      .where(and(eq(legalAcceptances.userId, userId), inArray(legalVersions.documentSlug, slugs))),
  ])

  return pendingAcceptance(
    documents.flatMap(({ currentVersion, currentVersionId, slug }) =>
      isLegalDocument(slug)
        ? [
            {
              currentVersion,
              currentVersionId,
              materialVersion: materials.find(material => material.slug === slug)?.version ?? null,
              slug,
            },
          ]
        : []
    ),
    accepted
  )
}
