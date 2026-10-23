import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase } from '@/actions/certificates/test-harness'
import { type CertificateRequestValues } from '@/components/features/certificates/schemas'
import { type CertificateSnapshot } from '@/db/schema'

describe.skipIf(!isLocalDatabase)('default certificate', () => {
  let fixture: Fixture
  let client: typeof import('@/db/client')
  let mutations: typeof import('@/db/mutations/certificate')

  const edit = (): CertificateRequestValues => ({
    activityDescription: 'Integration test activity',
    activityDuration: 120,
    activityEndDate: '2026-06-30',
    activityLocation: 'Milan',
    activityStartDate: '2026-01-10',
    language: 'en',
    rating: { experience: 4 },
    skills: fixture.courseIds.slice(0, 3).map(courseId => ({ courseId })),
    tasks: ['Welcomed new volunteers'],
  })

  const snapshot = (issuedAt: string): CertificateSnapshot => ({
    activity: { duration: 120, endDate: '2026-06-30', location: 'Milan', startDate: '2026-01-10', tasks: [] },
    holder: { birthPlace: null, birthday: null, firstName: 'Lane', lastName: null, nationality: null },
    issuedAt,
    language: 'en',
    organization: {
      id: fixture.organizationId,
      legalRepresentative: null,
      logoUrl: null,
      name: 'Org',
      signatureUrl: null,
    },
    skills: [],
  })

  const approve = async (id: number) => {
    const source = await fixture.reload(id)
    const issuedAt = new Date().toISOString()
    return await client.transaction(tx =>
      mutations.recordCertificateApproval(tx, {
        code: `LANE-S-DEF-${id}`,
        edit: edit(),
        expectedUpdatedAt: source.updatedAt,
        id,
        issuedAt,
        review: { comment: null },
        reviewerId: fixture.ids.tutorA,
        skills: fixture.courseIds.slice(0, 3).map(courseId => ({ courseId, level: 3, statement: null })),
        snapshot: snapshot(issuedAt),
      })
    )
  }

  const feature = (id: number, userId = fixture.ids.author) =>
    client.transaction(tx => mutations.recordFeaturedCertificate(tx, { id, userId }))

  const revoke = (id: number) =>
    client.transaction(tx =>
      mutations.recordCertificateRevocation(tx, { id, reason: 'Issued by mistake', revokedById: fixture.ids.owner })
    )

  const defaults = async (userId = fixture.ids.author) =>
    await fixture.db
      .select({ id: fixture.schema.certificates.id })
      .from(fixture.schema.certificates)
      .where(and(eq(fixture.schema.certificates.userId, userId), eq(fixture.schema.certificates.isDefault, true)))

  const setDefault = (id: number) =>
    fixture.db
      .update(fixture.schema.certificates)
      .set({ isDefault: true })
      .where(eq(fixture.schema.certificates.id, id))

  const inReview = (count: number) =>
    Promise.all(
      Array.from({ length: count }, () => fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' }))
    )

  beforeAll(async () => {
    fixture = await createFixture()
    client = await import('@/db/client')
    mutations = await import('@/db/mutations/certificate')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  it('refuses a second default certificate for the same holder', async () => {
    const first = await fixture.insertCertificate({ status: 'approved' })
    const second = await fixture.insertCertificate({ status: 'approved' })
    await setDefault(first.id)

    await expect(setDefault(second.id)).rejects.toThrow()

    expect((await defaults()).map(({ id }) => id)).toEqual([first.id])
  })

  it('allows one default certificate per holder', async () => {
    const mine = await fixture.insertCertificate({ status: 'approved' })
    const theirs = await fixture.insertCertificate({ status: 'approved', user: 'otherAuthor' })

    await setDefault(mine.id)
    await setDefault(theirs.id)

    expect(await defaults()).toHaveLength(1)
    expect(await defaults(fixture.ids.otherAuthor)).toHaveLength(1)
  })

  it('keeps one default when several approvals race', async () => {
    const certificates = await inReview(5)

    const results = await Promise.allSettled(certificates.map(({ id }) => approve(id)))

    expect(results.map(({ status }) => status)).toEqual(Array.from({ length: 5 }, () => 'fulfilled'))
    expect(await defaults()).toHaveLength(1)
  })

  it('keeps one default when a feature click races an approval', async () => {
    const featured = await fixture.insertCertificate({ status: 'approved' })
    const pending = await inReview(3)

    const results = await Promise.allSettled([feature(featured.id), ...pending.map(({ id }) => approve(id))])

    expect(results.map(({ status }) => status)).toEqual(Array.from({ length: 4 }, () => 'fulfilled'))
    expect(await defaults()).toHaveLength(1)
  })

  it('keeps one default when two feature clicks race', async () => {
    const first = await fixture.insertCertificate({ status: 'approved' })
    const second = await fixture.insertCertificate({ status: 'approved' })
    await setDefault(first.id)

    const results = await Promise.allSettled([feature(first.id), feature(second.id)])

    expect(results.map(({ status }) => status)).toEqual(['fulfilled', 'fulfilled'])
    expect(await defaults()).toHaveLength(1)
  })

  it('keeps one default when the default is revoked while another certificate is approved', async () => {
    const current = await fixture.insertCertificate({ status: 'approved' })
    await setDefault(current.id)
    const pending = await inReview(2)

    const results = await Promise.allSettled([revoke(current.id), ...pending.map(({ id }) => approve(id))])

    expect(results.map(({ status }) => status)).toEqual(['fulfilled', 'fulfilled', 'fulfilled'])
    const stored = await defaults()
    expect(stored).toHaveLength(1)
    expect(stored[0]?.id).not.toBe(current.id)
    expect((await fixture.reload(current.id)).isDefault).toBe(false)
  })
})
