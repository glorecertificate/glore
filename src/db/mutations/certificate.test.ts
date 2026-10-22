import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase } from '@/actions/certificates/test-harness'
import { type CertificateRequestValues } from '@/components/features/certificates/schemas'

describe.skipIf(!isLocalDatabase)('submitCertificateRequest', () => {
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

  const submit = (id: number, code: string) =>
    client.transaction(tx =>
      mutations.submitCertificateRequest(tx, {
        code,
        edit: edit(),
        from: 'draft',
        id,
        organizationId: fixture.organizationId,
        userId: fixture.ids.author,
      })
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

  it('submits one request when two drafts race', async () => {
    const first = await fixture.insertCertificate({ status: 'draft' })
    const second = await fixture.insertCertificate({ status: 'draft' })

    const results = await Promise.allSettled([submit(first.id, 'AAAA-AAAA-AAAA'), submit(second.id, 'BBBB-BBBB-BBBB')])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    expect(rejected).toHaveLength(1)
    expect(rejected[0]?.reason).toMatchObject({ code: 'CONFLICT' })
    const statuses = [(await fixture.reload(first.id)).status, (await fixture.reload(second.id)).status]
    expect(statuses.toSorted()).toEqual(['draft', 'submitted'])
  })

  it('submits again once the open request is closed', async () => {
    const first = await fixture.insertCertificate({ status: 'draft' })
    const second = await fixture.insertCertificate({ status: 'draft' })

    await submit(first.id, 'AAAA-AAAA-AAAA')
    await expect(submit(second.id, 'BBBB-BBBB-BBBB')).rejects.toMatchObject({ code: 'CONFLICT' })

    await client.transaction(tx =>
      mutations.withdrawCertificateRequest(tx, { id: first.id, userId: fixture.ids.author })
    )
    await expect(submit(second.id, 'BBBB-BBBB-BBBB')).resolves.toMatchObject({ row: { status: 'submitted' } })
  })
})
