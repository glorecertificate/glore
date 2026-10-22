import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type Fixture,
  createFixture,
  deleteMock,
  isLocalDatabase,
  notifyMock,
} from '@/actions/certificates/test-harness'
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

const SNAPSHOT = {
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
}

describe.skipIf(!isLocalDatabase)('account deletion keeps issued certificates valid', () => {
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
        snapshot: SNAPSHOT,
      })
      .where(eq(fixture.schema.certificates.id, cert.id))
    await fixture.db
      .update(fixture.schema.organizationRatings)
      .set({ comment: 'Supportive team' })
      .where(eq(fixture.schema.organizationRatings.certificateId, cert.id))
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
        email: `author-${fixture.ids.author}@issued.test`,
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

  it('detaches an issued certificate and keeps every original detail', async () => {
    const { cert } = await issueCertificate()
    const revoked = await fixture.insertCertificate({ code: generateCertificateCode(), status: 'revoked' })
    await fixture.db
      .update(fixture.schema.certificates)
      .set({ revokedAt: new Date().toISOString(), revokedReason: 'Named the volunteer' })
      .where(eq(fixture.schema.certificates.id, revoked.id))
    const draft = await fixture.insertCertificate({ status: 'draft' })
    const open = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
    const before = await fixture.reload(cert.id)

    expect((await eraseAuthor()).deleted).toBe(true)

    const after = await fixture.reload(cert.id)
    expect(after).toMatchObject({
      activityDescription: 'Helped at the community centre every week',
      activityDuration: 120,
      activityEndDate: '2026-06-30',
      activityLocation: 'Milan',
      activityStartDate: '2026-01-10',
      documentUrl: PDF_URL,
      isDefault: false,
      organizationId: fixture.organizationId,
      reviewerComment: 'Warm and reliable',
      reviewerId: fixture.ids.tutorA,
      status: 'approved',
      tasks: ['Welcomed new volunteers', 'Organized weekly activities'],
      userId: null,
    })
    expect(after.snapshot).toEqual(before.snapshot)
    expect(after.snapshot?.holder).toMatchObject({ firstName: 'author', lastName: 'Tester' })
    expect(after.holderDeletedAt).toBeTruthy()
    expect(after.skills).toHaveLength(3)
    for (const skill of after.skills) {
      expect(skill).toMatchObject({ evidence: 'Led the weekly welcome desk', selfLevel: 4 })
      expect(skill.statement).toMatch(/^Statement \d$/u)
    }
    expect(after.reviews[0]).toMatchObject({
      comment: 'Great work, Tester',
      scoreEngagement: 4,
      sectionComments: { tasks: 'Mentions the volunteer by name' },
    })
    const [rating] = await fixture.db
      .select()
      .from(fixture.schema.organizationRatings)
      .where(eq(fixture.schema.organizationRatings.certificateId, cert.id))
    expect(rating).toMatchObject({ comment: 'Supportive team', experience: 4 })
    const events = await fixture.eventsFor(cert.id)
    expect(JSON.stringify(events.map(({ metadata }) => metadata))).toContain('Add your surname')

    expect(await fixture.reload(revoked.id)).toMatchObject({
      revokedReason: 'Named the volunteer',
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

  it('keeps the certificate PDF in storage', async () => {
    await issueCertificate()
    await fixture.insertCertificate({ code: generateCertificateCode(), status: 'approved' })

    await eraseAuthor()

    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('verifies as valid with the original data and a neutral note', async () => {
    const { cert, code } = await issueCertificate()
    const revoked = await fixture.insertCertificate({ code: generateCertificateCode(), status: 'revoked' })
    await fixture.db
      .update(fixture.schema.certificates)
      .set({ revokedAt: new Date().toISOString(), snapshot: SNAPSHOT })
      .where(eq(fixture.schema.certificates.id, revoked.id))

    await eraseAuthor()

    const result = await pub.verifyCertificate(code)
    expect(result).toMatchObject({
      code,
      documentUrl: PDF_URL,
      holder: { firstName: 'author', lastName: 'Tester' },
      holderDeleted: true,
      organization: { name: 'Org a' },
      outcome: 'found',
      status: 'valid',
    })
    expect(result).toMatchObject({
      activity: { duration: 120, location: 'Milan', tasks: ['Desk'] },
      skills: [{ level: 4, statement: 'Led it' }],
    })
    expect(await pub.verifyCertificate(revoked.code!)).toMatchObject({
      holderDeleted: true,
      outcome: 'found',
      status: 'revoked',
    })
    expect(await pub.findLegacyCertificateCode('anyone', cert.handle)).toBe(code)
  })

  it('does not flag certificates whose holder is still on the platform', async () => {
    const { code } = await issueCertificate()

    expect(await pub.findCertificateByCode(code)).toMatchObject({ holderDeleted: false })
  })

  it('still renders the PDF from the stored snapshot', async () => {
    const { cert } = await issueCertificate()

    await eraseAuthor()

    const pdf = await (await import('@/actions/certificates/pdf')).certificatePdf(cert.id)
    expect(pdf?.buffer.subarray(0, 4).toString()).toBe('%PDF')
  })

  it('lists the certificate for managers under the holder name from the snapshot', async () => {
    const { cert } = await issueCertificate()
    await fixture.insertCertificate({ status: 'approved', user: 'otherAuthor' })

    await eraseAuthor()

    fixture.as('manager')
    const { data } = await queries.listOrganizationCertificates(fixture.organizationId, { cache: false })
    const listed = data?.find(({ id }) => id === cert.id)
    expect(listed).toMatchObject({
      holder: { firstName: 'author', lastName: 'Tester' },
      isApproved: true,
      isHolderDeleted: true,
      user: null,
      userId: null,
    })
    expect(data?.filter(({ isApproved }) => isApproved)).toHaveLength(2)
  })

  it('keeps orphaned certificates out of the tutor queue and the review flow', async () => {
    const { cert } = await issueCertificate()

    await eraseAuthor()

    fixture.as('tutorA')
    const queue = await queries.listTutorCertificates({ cache: false })
    expect((queue.data ?? []).map(({ id }) => id)).not.toContain(cert.id)
    expect((await queries.findReviewContext(cert.id)).error).not.toBeNull()
    expect((await queries.findCertificate(cert.id)).data?.id).toBe(cert.id)
    expect((await review.claimCertificateReview(cert.id)).error?.code).toBe('NOT_FOUND')

    fixture.as('outsider')
    expect((await queries.findCertificate(cert.id)).error).not.toBeNull()
    expect((await queries.findCertificateActivity(cert.id)).error).not.toBeNull()

    fixture.as('manager')
    expect((await queries.findCertificate(cert.id)).data).toMatchObject({ isHolderDeleted: true, userId: null })
    expect((await queries.findCertificateActivity(cert.id)).error).toBeNull()
  })

  it('lets managers and platform admins revoke it with no holder to notify', async () => {
    const { cert, code } = await issueCertificate()
    const second = await fixture.insertCertificate({ code: generateCertificateCode(), status: 'approved' })

    await eraseAuthor()
    notifyMock.mockClear()

    fixture.as('manager')
    const revoked = await review.revokeCertificate(cert.id, { reason: 'Details were wrong, verified with the holder' })
    expect(revoked.error).toBeNull()
    expect(await fixture.reload(cert.id)).toMatchObject({
      revokedById: fixture.ids.manager,
      status: 'revoked',
      userId: null,
    })
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ certificateId: cert.id, holderId: null }),
        type: 'certificate.revoked',
      })
    )
    expect(await pub.verifyCertificate(code)).toMatchObject({
      holderDeleted: true,
      outcome: 'found',
      status: 'revoked',
    })

    fixture.as('platformAdmin')
    expect((await review.revokeCertificate(second.id, { reason: 'Requested by the former holder' })).error).toBeNull()
    expect((await review.revokeCertificate(second.id, { reason: 'Requested by the former holder' })).error?.code).toBe(
      'INVALID_STATE'
    )

    fixture.as('tutorA')
    expect((await review.revokeCertificate(cert.id, { reason: 'Tutors cannot revoke certificates' })).error?.code).toBe(
      'FORBIDDEN'
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
