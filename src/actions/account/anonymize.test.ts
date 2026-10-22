import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, deleteMock, isLocalDatabase } from '@/actions/certificates/test-harness'
import { generateCertificateCode } from '@/components/features/certificates/rules'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', async () => (await import('@/actions/certificates/test-harness')).mocks.auth)
vi.mock('@/actions/user', async () => (await import('@/actions/certificates/test-harness')).mocks.user)
vi.mock('@/actions/courses/queries', async () => (await import('@/actions/certificates/test-harness')).mocks.courses)
vi.mock(
  '@/actions/notifications/notify',
  async () => (await import('@/actions/certificates/test-harness')).mocks.notify
)
vi.mock('@/lib/rate-limit', async () => (await import('@/actions/certificates/test-harness')).mocks.rateLimit)
vi.mock('@/lib/storage', async () => (await import('@/actions/certificates/test-harness')).mocks.storage)

const PDF_URL = 'https://r2.test/certificates/holder.pdf'

describe.skipIf(!isLocalDatabase)('account deletion keeps issued certificates anonymized', () => {
  let fixture: Fixture
  let deletion: typeof import('@/actions/account/deletion')
  let pub: typeof import('@/actions/certificates/public')
  let queries: typeof import('@/actions/certificates/queries')
  let review: typeof import('@/actions/certificates/review')

  const eraseAuthor = async () => {
    const [user] = await fixture.db
      .select()
      .from(fixture.schema.users)
      .where(eq(fixture.schema.users.id, fixture.ids.author))
    return await deletion.eraseAccount({
      email: user!.email,
      firstName: user!.firstName,
      id: user!.id,
      locale: user!.locale,
    })
  }

  const issueCertificate = async () => {
    const code = generateCertificateCode()
    const cert = await fixture.insertCertificate({ code, reviewer: 'tutorA', status: 'approved' })
    await fixture.db
      .update(fixture.schema.certificates)
      .set({
        documentUrl: PDF_URL,
        isDefault: true,
        reviewerComment: 'Warm and reliable',
        snapshot: {
          activity: {
            duration: 120,
            endDate: '2026-06-30',
            location: 'Milan',
            startDate: '2026-01-10',
            tasks: ['Desk'],
          },
          holder: {
            birthPlace: 'Milan',
            birthday: '2000-01-01',
            firstName: 'author',
            lastName: 'Tester',
            nationality: 'it',
          },
          issuedAt: '2026-07-01T10:00:00.000Z',
          language: 'en',
          organization: { id: 1, legalRepresentative: 'Rep', logoUrl: null, name: 'Org a', signatureUrl: null },
          skills: [{ courseId: 1, icon: null, level: 4, name: { en: 'Skill', es: '', it: '' }, statement: 'Led it' }],
        },
      })
      .where(eq(fixture.schema.certificates.id, cert.id))
    await fixture.db.insert(fixture.schema.certificateReviews).values({
      certificateId: cert.id,
      comment: 'Great work, Tester',
      decision: 'approved',
      reviewerId: fixture.ids.tutorA,
      scoreEngagement: 4,
      sectionComments: { tasks: 'Mentions the volunteer by name' },
    })
    await fixture.db.insert(fixture.schema.activityEvents).values({
      action: 'certificate.changes_requested',
      metadata: { comment: 'Add your surname', tutorId: fixture.ids.tutorA },
      organizationId: fixture.organizationId,
      subjectId: String(cert.id),
      subjectType: 'certificate',
    })
    return { cert, code }
  }

  beforeAll(async () => {
    fixture = await createFixture()
    ;[deletion, pub, queries, review] = await Promise.all([
      import('@/actions/account/deletion'),
      import('@/actions/certificates/public'),
      import('@/actions/certificates/queries'),
      import('@/actions/certificates/review'),
    ])
  })

  const clearDeletionEvents = async () => {
    await fixture.db
      .delete(fixture.schema.activityEvents)
      .where(eq(fixture.schema.activityEvents.subjectId, fixture.ids.author))
  }

  beforeEach(async () => {
    await clearDeletionEvents()
    await fixture.db
      .insert(fixture.schema.users)
      .values({
        birthPlace: 'Milan',
        birthday: '2000-01-01',
        email: `author-${fixture.ids.author}@anonymize.test`,
        firstName: 'author',
        id: fixture.ids.author,
        lastName: 'Tester',
        name: 'author',
        nationality: 'it',
      })
      .onConflictDoNothing()
    await fixture.reset()
  })

  afterAll(async () => {
    await clearDeletionEvents()
    await fixture.cleanup()
  })

  it('detaches and scrubs an approved certificate, keeping the aggregate data', async () => {
    const { cert } = await issueCertificate()
    const revoked = await fixture.insertCertificate({ code: generateCertificateCode(), status: 'revoked' })
    await fixture.db
      .update(fixture.schema.certificates)
      .set({ revokedAt: new Date().toISOString(), revokedReason: 'Named the volunteer' })
      .where(eq(fixture.schema.certificates.id, revoked.id))
    const draft = await fixture.insertCertificate({ status: 'draft' })
    const open = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })

    expect((await eraseAuthor()).deleted).toBe(true)

    const after = await fixture.reload(cert.id)
    expect(after).toMatchObject({
      activityDescription: '',
      activityDuration: 120,
      activityEndDate: '2026-06-30',
      activityLocation: '',
      activityStartDate: '2026-01-10',
      documentUrl: null,
      isDefault: false,
      organizationId: fixture.organizationId,
      reviewerComment: null,
      reviewerId: fixture.ids.tutorA,
      snapshot: null,
      status: 'approved',
      tasks: [],
      userId: null,
    })
    expect(after.holderDeletedAt).toBeTruthy()
    expect(after.skills).toHaveLength(3)
    for (const skill of after.skills) {
      expect(skill).toMatchObject({ evidence: null, selfLevel: 4, statement: null })
    }
    expect(after.reviews[0]).toMatchObject({ comment: null, scoreEngagement: 4, sectionComments: {} })
    const [rating] = await fixture.db
      .select()
      .from(fixture.schema.organizationRatings)
      .where(eq(fixture.schema.organizationRatings.certificateId, cert.id))
    expect(rating).toMatchObject({ comment: null, experience: 4 })
    const events = await fixture.eventsFor(cert.id)
    expect(JSON.stringify(events.map(({ metadata }) => metadata))).not.toContain('surname')

    expect(await fixture.reload(revoked.id)).toMatchObject({
      revokedReason: null,
      status: 'revoked',
      userId: null,
    })
    const remaining = await fixture.db
      .select({ id: fixture.schema.certificates.id })
      .from(fixture.schema.certificates)
      .where(eq(fixture.schema.certificates.organizationId, fixture.organizationId))
    expect(remaining.map(({ id }) => id).toSorted()).toEqual([cert.id, revoked.id].toSorted())
    expect(remaining.map(({ id }) => id)).not.toContain(draft.id)
    expect(remaining.map(({ id }) => id)).not.toContain(open.id)
  })

  it('deletes the PDF from storage', async () => {
    await issueCertificate()
    await fixture.insertCertificate({ code: generateCertificateCode(), status: 'approved' })

    await eraseAuthor()

    expect(deleteMock).toHaveBeenCalledWith(PDF_URL)
    expect(deleteMock).toHaveBeenCalledTimes(1)
  })

  it('answers the public lookup with the no longer valid state and nothing else', async () => {
    const { cert, code } = await issueCertificate()
    const revoked = await fixture.insertCertificate({ code: generateCertificateCode(), status: 'revoked' })

    await eraseAuthor()

    const result = await pub.verifyCertificate(code)
    expect(result).toEqual({ code, outcome: 'holder_deleted' })
    expect(await pub.findCertificateByCode(code)).toEqual({ code, status: 'holder_deleted' })
    expect(JSON.stringify(result)).not.toMatch(/Tester|author|Org a|r2\.test/u)
    expect(await pub.verifyCertificate(revoked.code!)).toEqual({ code: revoked.code, outcome: 'holder_deleted' })
    expect(await pub.findLegacyCertificateCode('anyone', cert.handle)).toBe(code)
  })

  it('keeps the certificate in the organization list with no holder', async () => {
    const { cert } = await issueCertificate()
    await fixture.insertCertificate({ status: 'approved', user: 'otherAuthor' })

    await eraseAuthor()

    fixture.as('manager')
    const { data } = await queries.listOrganizationCertificates(fixture.organizationId, { cache: false })
    const listed = data?.find(({ id }) => id === cert.id)
    expect(listed).toMatchObject({ isApproved: true, isHolderDeleted: true, user: null, userId: null })
    expect(data?.filter(({ isApproved }) => isApproved)).toHaveLength(2)
  })

  it('never offers an anonymized certificate to tutors, viewers, or the lifecycle actions', async () => {
    const { cert } = await issueCertificate()

    await eraseAuthor()

    fixture.as('tutorA')
    const queue = await queries.listTutorCertificates({ cache: false })
    expect((queue.data ?? []).map(({ id }) => id)).not.toContain(cert.id)
    expect((await queries.findCertificate(cert.id)).error).not.toBeNull()
    expect((await queries.findCertificateActivity(cert.id)).error).not.toBeNull()
    expect((await queries.findReviewContext(cert.id)).error).not.toBeNull()

    fixture.as('manager')
    expect((await queries.findCertificate(cert.id)).error).not.toBeNull()
    expect((await review.revokeCertificate(cert.id, { reason: 'Because of a long reason' })).error?.code).toBe(
      'NOT_FOUND'
    )
  })

  it('records the account deletion event once', async () => {
    await issueCertificate()
    await eraseAuthor()

    const events = await fixture.db.query.activityEvents.findMany({
      where: eq(fixture.schema.activityEvents.action, 'account.deleted'),
    })
    expect(events.filter(({ subjectId }) => subjectId === fixture.ids.author)).toHaveLength(1)
  })
})
