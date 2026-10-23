import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('loadLegalDocument', () => {
  const slug = `reader-${randomUUID().slice(0, 8)}`
  let context: {
    client: typeof import('@/db/client')
    lib: typeof import('@/lib/legal')
    schema: typeof import('@/db/schema')
  }
  let versionId = 0

  const load = async (locale: 'en' | 'es' | 'it') =>
    await context.lib.loadLegalDocument(slug as 'terms', locale, { cache: false })

  beforeAll(async () => {
    const [client, lib, schema] = await Promise.all([
      import('@/db/client'),
      import('@/lib/legal'),
      import('@/db/schema'),
    ])
    context = { client, lib, schema }
    await client.db.insert(schema.legalDocuments).values({ slug })
    const [version] = await client.db
      .insert(schema.legalVersions)
      .values({ documentSlug: slug, effectiveAt: '2026-10-22', material: true, status: 'published', version: 1 })
      .returning({ id: schema.legalVersions.id })
    if (!version) throw new Error('Failed to create the test version')
    versionId = version.id
    await client.db.insert(schema.legalTranslations).values([
      { body: 'English body', locale: 'en', status: 'reviewed', title: 'English title', versionId },
      { body: 'Corpo italiano', locale: 'it', status: 'reviewed', title: 'Titolo italiano', versionId },
    ])
    await client.db
      .update(schema.legalDocuments)
      .set({ currentVersionId: versionId })
      .where(eq(schema.legalDocuments.slug, slug))
  })

  afterAll(async () => {
    const { client, schema } = context
    await client.db
      .update(schema.legalDocuments)
      .set({ currentVersionId: null })
      .where(eq(schema.legalDocuments.slug, slug))
    await client.db.delete(schema.legalDocuments).where(eq(schema.legalDocuments.slug, slug))
  })

  it('reads the current version in the requested language', async () => {
    expect(await load('it')).toEqual({
      body: 'Corpo italiano',
      effectiveAt: '2026-10-22',
      locale: 'it',
      material: true,
      title: 'Titolo italiano',
      version: 1,
      versionId,
    })
  })

  it('falls back to English when the language has no text', async () => {
    expect(await load('es')).toMatchObject({ body: 'English body', locale: 'en', title: 'English title' })
  })

  it('returns null for a document without a current version', async () => {
    expect(await context.lib.loadLegalDocument(`missing-${slug}` as 'terms', 'en', { cache: false })).toBeNull()
  })
})
