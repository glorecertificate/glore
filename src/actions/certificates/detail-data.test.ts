import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase } from '@/actions/certificates/test-harness'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/viewer', async () => {
  const { mocks } = await import('@/actions/certificates/test-harness')
  return { getViewerContext: async () => ({ user: await mocks.user.getCurrentUser() }) }
})

describe.skipIf(!isLocalDatabase)('certificate detail loaders', () => {
  let fixture: Fixture
  let loaders: typeof import('@/actions/certificates/detail-data')

  beforeAll(async () => {
    fixture = await createFixture()
    loaders = await import('@/actions/certificates/detail-data')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  it('shows the organization rating to the author only', async () => {
    const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })

    fixture.as('author')
    expect((await loaders.loadCertificate(cert.id))?.rating?.experience).toBe(4)

    fixture.as('tutorA')
    const asTutor = await loaders.loadCertificate(cert.id)
    expect(asTutor).not.toBeNull()
    expect(asTutor?.rating).toBeNull()
  })

  it('keeps drafts private and hides certificates from other organizations', async () => {
    const draft = await fixture.insertCertificate({ status: 'draft' })
    const open = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted', user: 'otherAuthor' })

    fixture.as('manager')
    expect(await loaders.loadCertificate(draft.id)).toBeNull()
    expect(await loaders.loadCertificate(open.id)).not.toBeNull()

    fixture.as('foreignTutor')
    expect(await loaders.loadCertificate(open.id)).toBeNull()
    expect(await loaders.loadCertificateActivity(open.id)).toBeNull()
  })

  it('gives the review context to the assigned reviewer only', async () => {
    const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })

    fixture.as('tutorA')
    expect(await loaders.loadReviewContext(cert.id)).not.toBeNull()

    for (const key of ['manager', 'author', 'foreignTutor'] as const) {
      fixture.as(key)
      expect(await loaders.loadReviewContext(cert.id)).toBeNull()
    }
  })

  it('stops a reviewer who is no longer a tutor of the organization from reading a closed certificate', async () => {
    const cert = await fixture.insertCertificate({ reviewer: 'learner', status: 'approved' })

    fixture.as('learner')
    expect(await loaders.loadCertificate(cert.id)).toBeNull()
    expect(await loaders.loadCertificateActivity(cert.id)).toBeNull()

    fixture.as('tutorA')
    const own = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'approved' })
    expect(await loaders.loadCertificate(own.id)).not.toBeNull()
  })
})
