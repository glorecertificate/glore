import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase } from '@/actions/certificates/test-harness'

const dynamic = () => {
  throw new Error('Request data read inside a cache scope')
}

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', () => ({ getAuthUser: dynamic }))
vi.mock('@/actions/user', () => ({ getActiveOrgId: dynamic, getCurrentUser: dynamic }))
vi.mock('@/actions/viewer', () => ({ getViewer: dynamic, getViewerContext: dynamic, getViewerOrgId: dynamic }))
vi.mock('next/headers', () => ({ cookies: dynamic, headers: dynamic }))
vi.mock('next/server', async importOriginal => ({ ...(await importOriginal<object>()), connection: dynamic }))

describe.skipIf(!isLocalDatabase)('volunteer dashboard summary', () => {
  let fixture: Fixture
  let summary: typeof import('@/actions/dashboard/member')

  beforeAll(async () => {
    fixture = await createFixture()
    summary = await import('@/actions/dashboard/member')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  it('reads the review notes of a changes-requested certificate without request data', async () => {
    const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'changes_requested' })
    const { db, schema } = fixture
    await db.insert(schema.certificateReviews).values({
      certificateId: cert.id,
      comment: 'Add hours',
      decision: 'changes_requested',
      reviewerId: fixture.ids.tutorA,
      sectionComments: { experience: 'More detail' },
    })

    const holder = { birthPlace: null, birthday: null, firstName: 'Vera', lastName: null, nationality: null }
    const result = await summary.loadVolunteerSummary({
      holder,
      language: 'en',
      organizationId: fixture.organizationId,
      userId: fixture.ids.author,
    })

    expect(result.certificate?.id).toBe(cert.id)
    expect(result.review?.comment).toBe('Add hours')
    expect(result.journey.stages.length).toBe(4)
  })
})
