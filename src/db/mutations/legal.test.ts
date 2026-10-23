import { randomUUID } from 'node:crypto'

import { and, eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

class Rollback extends Error {}

const LOCALES = ['en', 'es', 'it'] as const

const text = (locale: string, extra = '') => ({
  body: `## One\n\nBody ${locale}${extra}\n\n## Two\n\nMore`,
  title: `Title ${locale}`,
})

describe.skipIf(!isLocalDatabase)('legal mutations', () => {
  let context: {
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/legal')
    schema: typeof import('@/db/schema')
    lib: typeof import('@/lib/legal')
  }

  type Tx = Parameters<Parameters<typeof context.client.transaction>[0]>[0]

  const rolledBack = async (work: (tx: Tx, actorId: string) => Promise<void>) => {
    const { client, schema } = context
    await client
      .transaction(async tx => {
        const actorId = randomUUID()
        await tx.insert(schema.users).values({
          email: `${actorId}@legal.test`,
          firstName: 'Legal',
          id: actorId,
          name: 'Legal Admin',
          onboardedAt: new Date().toISOString(),
        })
        await work(tx, actorId)
        throw new Rollback()
      })
      .catch((error: unknown) => {
        if (!(error instanceof Rollback)) throw error
      })
  }

  const rejection = async (promise: Promise<unknown>) => {
    try {
      await promise
    } catch (error) {
      return error as Error & { code?: string; locales?: string[] }
    }
    throw new Error('Expected a rejection')
  }

  const fillDraft = async (tx: Tx, actorId: string, versionId: number, extra = '') => {
    for (const locale of LOCALES) {
      await context.mutations.saveLegalTranslation(tx, { actorId, locale, versionId, ...text(locale, extra) })
    }
  }

  const publish = async (
    tx: Tx,
    actorId: string,
    versionId: number,
    overrides: Partial<{ changeNote: string | null; effectiveAt: string; material: boolean }> = {}
  ) =>
    await context.mutations.publishLegalVersion(tx, {
      actorId,
      changeNote: null,
      effectiveAt: '2026-11-01',
      material: false,
      versionId,
      ...overrides,
    })

  const versionOf = async (tx: Tx, id: number) => {
    const [row] = await tx.select().from(context.schema.legalVersions).where(eq(context.schema.legalVersions.id, id))
    if (!row) throw new Error('Missing version')
    return row
  }

  beforeAll(async () => {
    const [client, mutations, schema, lib] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/legal'),
      import('@/db/schema'),
      import('@/lib/legal'),
    ])
    context = { client, lib, mutations, schema }
  })

  it('publishes a draft, supersedes the previous version, and records the event', async () => {
    await rolledBack(async (tx, actorId) => {
      const first = await context.mutations.createLegalDraft(tx, { actorId, slug: 'quality-charter' })
      await fillDraft(tx, actorId, first.id)
      const { event, slug } = await publish(tx, actorId, first.id, { changeNote: 'First' })
      expect(slug).toBe('quality-charter')
      expect(event).toMatchObject({
        actorId,
        data: { effectiveAt: '2026-11-01', material: false, slug, version: first.version, versionId: first.id },
        type: 'legal.version_published',
      })

      const published = await versionOf(tx, first.id)
      expect(published).toMatchObject({ changeNote: 'First', publishedById: actorId, status: 'published' })
      const translations = await tx
        .select()
        .from(context.schema.legalTranslations)
        .where(eq(context.schema.legalTranslations.versionId, first.id))
      expect(translations.map(({ status }) => status)).toEqual(['reviewed', 'reviewed', 'reviewed'])

      const second = await context.mutations.createLegalDraft(tx, { actorId, slug: 'quality-charter' })
      expect(second.version).toBe(first.version + 1)
      const copied = await tx
        .select()
        .from(context.schema.legalTranslations)
        .where(eq(context.schema.legalTranslations.versionId, second.id))
      expect(copied).toHaveLength(3)
      expect(copied.find(({ locale }) => locale === 'es')?.sourceHash).toBe(
        context.mutations.hashLegalText(text('en').body)
      )

      await publish(tx, actorId, second.id)
      expect((await versionOf(tx, first.id)).status).toBe('superseded')
      expect((await versionOf(tx, second.id)).status).toBe('published')
      const [document] = await tx
        .select()
        .from(context.schema.legalDocuments)
        .where(eq(context.schema.legalDocuments.slug, 'quality-charter'))
      expect(document?.currentVersionId).toBe(second.id)
    })
  })

  it('never changes a version once it is published', async () => {
    await rolledBack(async (tx, actorId) => {
      const draft = await context.mutations.createLegalDraft(tx, { actorId, slug: 'quality-charter' })
      await fillDraft(tx, actorId, draft.id)
      await publish(tx, actorId, draft.id)

      const edit = await rejection(
        context.mutations.saveLegalTranslation(tx, {
          actorId,
          locale: 'en',
          versionId: draft.id,
          ...text('en', ' edited'),
        })
      )
      expect(edit.code).toBe('NOT_DRAFT')
      expect((await rejection(context.mutations.discardLegalDraft(tx, draft.id))).code).toBe('NOT_DRAFT')
      expect((await rejection(publish(tx, actorId, draft.id))).code).toBe('NOT_DRAFT')

      const [english] = await tx
        .select()
        .from(context.schema.legalTranslations)
        .where(
          and(
            eq(context.schema.legalTranslations.versionId, draft.id),
            eq(context.schema.legalTranslations.locale, 'en')
          )
        )
      expect(english?.body).toBe(text('en').body)
    })
  })

  it('allows one draft per document and lets a discarded draft be recreated', async () => {
    await rolledBack(async (tx, actorId) => {
      const draft = await context.mutations.createLegalDraft(tx, { actorId, slug: 'privacy' })
      expect((await rejection(context.mutations.createLegalDraft(tx, { actorId, slug: 'privacy' }))).code).toBe(
        'DRAFT_EXISTS'
      )
      await context.mutations.discardLegalDraft(tx, draft.id)
      const again = await context.mutations.createLegalDraft(tx, { actorId, slug: 'privacy' })
      expect(again.version).toBe(draft.version)
    })
  })

  it('refuses to publish a draft that misses a language', async () => {
    await rolledBack(async (tx, actorId) => {
      const draft = await context.mutations.createLegalDraft(tx, { actorId, slug: 'quality-charter' })
      await context.mutations.saveLegalTranslation(tx, { actorId, locale: 'en', versionId: draft.id, ...text('en') })
      await context.mutations.saveLegalTranslation(tx, { actorId, locale: 'es', versionId: draft.id, ...text('es') })
      await tx
        .delete(context.schema.legalTranslations)
        .where(
          and(
            eq(context.schema.legalTranslations.versionId, draft.id),
            eq(context.schema.legalTranslations.locale, 'it')
          )
        )
      const error = await rejection(publish(tx, actorId, draft.id))
      expect(error.code).toBe('INCOMPLETE')
      expect(error.locales).toEqual(['it'])
      expect((await versionOf(tx, draft.id)).status).toBe('draft')
    })
  })

  it('refuses to publish translations whose headings differ from English', async () => {
    await rolledBack(async (tx, actorId) => {
      const draft = await context.mutations.createLegalDraft(tx, { actorId, slug: 'quality-charter' })
      await fillDraft(tx, actorId, draft.id)
      await context.mutations.saveLegalTranslation(tx, {
        actorId,
        body: '## Only one',
        locale: 'es',
        title: 'Titulo',
        versionId: draft.id,
      })
      const error = await rejection(publish(tx, actorId, draft.id))
      expect(error.code).toBe('HEADINGS_DIFFER')
      expect(error.locales).toEqual(['es'])
      expect((await versionOf(tx, draft.id)).status).toBe('draft')
    })
  })

  it('keeps the material flag only for documents that need acceptance', async () => {
    await rolledBack(async (tx, actorId) => {
      const charter = await context.mutations.createLegalDraft(tx, { actorId, slug: 'quality-charter' })
      await fillDraft(tx, actorId, charter.id)
      await publish(tx, actorId, charter.id, { material: true })
      expect((await versionOf(tx, charter.id)).material).toBe(false)

      const terms = await context.mutations.createLegalDraft(tx, { actorId, slug: 'terms' })
      await fillDraft(tx, actorId, terms.id)
      await publish(tx, actorId, terms.id, { material: true })
      expect((await versionOf(tx, terms.id)).material).toBe(true)
    })
  })

  it('records one acceptance per user and version', async () => {
    await rolledBack(async (tx, actorId) => {
      const draft = await context.mutations.createLegalDraft(tx, { actorId, slug: 'terms' })
      await fillDraft(tx, actorId, draft.id)
      await publish(tx, actorId, draft.id)

      const events = await context.mutations.acceptCurrentLegal(tx, { locale: 'it', userId: actorId })
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        actorId,
        data: { slug: 'terms', userId: actorId, versionId: draft.id },
        type: 'legal.accepted',
      })
      expect(await context.mutations.acceptCurrentLegal(tx, { locale: 'it', userId: actorId })).toEqual([])

      const rows = await tx
        .select()
        .from(context.schema.legalAcceptances)
        .where(eq(context.schema.legalAcceptances.userId, actorId))
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ locale: 'it', versionId: draft.id })
    })
  })

  it('asks for acceptance only after a material terms version', async () => {
    await rolledBack(async (tx, actorId) => {
      const pending = async (userId: string) =>
        await context.mutations.queryPendingLegal(userId, tx as unknown as typeof context.client.db)

      await context.mutations.acceptCurrentLegal(tx, { locale: 'en', userId: actorId })
      const minor = await context.mutations.createLegalDraft(tx, { actorId, slug: 'terms' })
      await fillDraft(tx, actorId, minor.id)
      await publish(tx, actorId, minor.id)
      expect(await pending(actorId)).toBeNull()

      const material = await context.mutations.createLegalDraft(tx, { actorId, slug: 'terms' })
      await fillDraft(tx, actorId, material.id, ' v2')
      await publish(tx, actorId, material.id, { material: true })
      expect(await pending(actorId)).toEqual({ slug: 'terms', version: material.version, versionId: material.id })

      await context.mutations.acceptCurrentLegal(tx, { locale: 'en', userId: actorId })
      expect(await pending(actorId)).toBeNull()

      const later = await context.mutations.createLegalDraft(tx, { actorId, slug: 'terms' })
      await fillDraft(tx, actorId, later.id, ' v3')
      await publish(tx, actorId, later.id)
      expect(await pending(actorId)).toBeNull()

      const another = await context.mutations.createLegalDraft(tx, { actorId, slug: 'terms' })
      await fillDraft(tx, actorId, another.id, ' v4')
      await publish(tx, actorId, another.id, { material: true })
      expect(await pending(actorId)).toMatchObject({ versionId: another.id })
    })
  })
})
