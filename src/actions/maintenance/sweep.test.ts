import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type CertificateSnapshot } from '@/db/schema'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const NOW = new Date('2030-06-01T00:00:00.000Z')
const OLD = new Date('2030-01-01T00:00:00.000Z')

const storage = vi.hoisted(() => ({
  deleted: [] as string[],
  inFlight: 0,
  listings: {} as Record<string, { key: string; lastModified: Date }[]>,
  maxInFlight: 0,
}))

vi.mock('@/lib/storage', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/storage')>()),
  r2Delete: vi.fn(async (key: string) => {
    storage.inFlight += 1
    storage.maxInFlight = Math.max(storage.maxInFlight, storage.inFlight)
    await new Promise(resolve => setTimeout(resolve, 1))
    storage.inFlight -= 1
    storage.deleted.push(key)
  }),
  r2List: vi.fn((prefix: string) => Promise.resolve(storage.listings[prefix] ?? [])),
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('orphan sweeps', () => {
  const suffix = randomUUID().slice(0, 8)
  let organizationId = 0
  let context: {
    client: typeof import('@/db/client')
    prune: typeof import('@/actions/maintenance/prune')
    schema: typeof import('@/db/schema')
  }

  const url = (key: string) => `https://r2.test/${key}`

  const snapshot = (logoUrl: string | null, signatureUrl: string | null): CertificateSnapshot => ({
    activity: { duration: 120, endDate: '2026-06-30', location: 'Milan', startDate: '2026-01-10', tasks: ['Task'] },
    holder: { birthPlace: null, birthday: null, firstName: 'Holder', lastName: null, nationality: null },
    issuedAt: '2026-07-01T00:00:00.000Z',
    language: 'en',
    organization: { id: organizationId, legalRepresentative: null, logoUrl, name: 'Sweep', signatureUrl },
    skills: [],
  })

  const issue = async (values: Partial<typeof context.schema.certificates.$inferInsert> = {}) => {
    const handle = `sweep-${suffix}-${randomUUID().slice(0, 8)}`
    const [row] = await context.client.db
      .insert(context.schema.certificates)
      .values({
        activityDescription: 'Helped',
        activityDuration: 120,
        activityEndDate: '2026-06-30',
        activityLocation: 'Milan',
        activityStartDate: '2026-01-10',
        handle,
        holderDeletedAt: new Date().toISOString(),
        language: 'en',
        organizationId,
        status: 'approved',
        ...values,
      })
      .returning()
    if (!row) throw new Error('Failed to insert certificate')
    return row
  }

  const clearCertificates = async () =>
    await context.client.db
      .delete(context.schema.certificates)
      .where(eq(context.schema.certificates.organizationId, organizationId))

  beforeAll(async () => {
    const [client, prune, schema] = await Promise.all([
      import('@/db/client'),
      import('@/actions/maintenance/prune'),
      import('@/db/schema'),
    ])
    context = { client, prune, schema }
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({ city: 'Milan', email: `sweep-${suffix}@sweep.test`, handle: `sweep-${suffix}`, name: 'Sweep' })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    organizationId = organization.id
  })

  beforeEach(async () => {
    storage.deleted.length = 0
    storage.listings = {}
    storage.inFlight = 0
    storage.maxInFlight = 0
    await clearCertificates()
  })

  afterAll(async () => {
    await clearCertificates()
    await context.client.db
      .delete(context.schema.organizations)
      .where(eq(context.schema.organizations.id, organizationId))
  })

  describe('sweepOrphanAvatars', () => {
    it('keeps logos that an issued certificate snapshot still shows', async () => {
      const shown = `organizations/${suffix}-shown.png`
      const unused = `organizations/${suffix}-unused.png`
      storage.listings['organizations/'] = [
        { key: shown, lastModified: OLD },
        { key: unused, lastModified: OLD },
      ]
      await issue({ snapshot: snapshot(url(shown), null) })

      const removed = await context.prune.sweepOrphanAvatars(NOW)

      expect(removed).toBe(1)
      expect(storage.deleted).toEqual([unused])
    })
  })

  describe('batching', () => {
    const strays = (prefix: string) =>
      Array.from({ length: 45 }, (_, index) => ({ key: `${prefix}${suffix}-stray-${index}.bin`, lastModified: OLD }))

    it('deletes orphan avatars in batches of at most 20', async () => {
      storage.listings['organizations/'] = strays('organizations/')

      expect(await context.prune.sweepOrphanAvatars(NOW)).toBe(45)

      expect(storage.deleted).toHaveLength(45)
      expect(storage.maxInFlight).toBeGreaterThan(1)
      expect(storage.maxInFlight).toBeLessThanOrEqual(20)
    })

    it('deletes orphan certificate PDFs in batches of at most 20', async () => {
      storage.listings['certificates/'] = strays('certificates/')

      expect(await context.prune.sweepOrphanCertificatePdfs(NOW)).toBe(45)

      expect(storage.deleted).toHaveLength(45)
      expect(storage.maxInFlight).toBeGreaterThan(1)
      expect(storage.maxInFlight).toBeLessThanOrEqual(20)
    })
  })

  describe('sweepOrphanCertificatePdfs', () => {
    it('keeps the PDF of an approved certificate and drops the PDF of a revoked one', async () => {
      const live = await issue({ documentUrl: url(`certificates/${suffix}-live.pdf`), status: 'approved' })
      const revoked = await issue({
        documentUrl: url(`certificates/${suffix}-revoked.pdf`),
        revokedAt: new Date().toISOString(),
        status: 'revoked',
      })
      const stray = `certificates/${suffix}-stray.pdf`
      storage.listings['certificates/'] = [
        { key: `certificates/${live.handle}.pdf`, lastModified: OLD },
        { key: `certificates/${revoked.handle}.pdf`, lastModified: OLD },
        { key: `certificates/${suffix}-live.pdf`, lastModified: OLD },
        { key: `certificates/${suffix}-revoked.pdf`, lastModified: OLD },
        { key: stray, lastModified: OLD },
      ]

      await context.prune.sweepOrphanCertificatePdfs(NOW)

      expect(storage.deleted.toSorted()).toEqual(
        [`certificates/${revoked.handle}.pdf`, `certificates/${suffix}-revoked.pdf`, stray].toSorted()
      )
    })
  })
})
