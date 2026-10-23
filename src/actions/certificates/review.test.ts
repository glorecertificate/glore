import { updateTag } from 'next/cache'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type Fixture,
  createFixture,
  deleteMock,
  isLocalDatabase,
  notifyMock,
  putMock,
} from '@/actions/certificates/test-harness'
import { generateCertificateCode } from '@/components/features/certificates/rules'
import { certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'

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

const CODE_REGEX = /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/u

describe.skipIf(!isLocalDatabase)('certificate review', () => {
  let fixture: Fixture
  let review: typeof import('@/actions/certificates/review')
  let requests: typeof import('@/actions/certificates/requests')

  beforeAll(async () => {
    fixture = await createFixture()
    review = await import('@/actions/certificates/review')
    requests = await import('@/actions/certificates/requests')
  })

  beforeEach(async () => {
    await fixture.reset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture.cleanup()
  })

  const plainSkills = (
    rows: {
      courseId: number
      evidence: string | null
      level: number | null
      selfLevel: number | null
      sortOrder: number
      statement: string | null
    }[]
  ) =>
    rows
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map(({ courseId, evidence, level, selfLevel, sortOrder, statement }) => ({
        courseId,
        evidence,
        level,
        selfLevel,
        sortOrder,
        statement,
      }))

  const reason = 'The activity description does not match the stated tasks'

  describe('claim', () => {
    it('moves a submitted request to in review and tells the volunteer', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('tutorA')
      const { data, error } = await review.claimCertificateReview(cert.id)

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerId: fixture.ids.tutorA, status: 'in_review' })
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.claimed'])
      expect(events[0]?.metadata).toMatchObject({ holderId: fixture.ids.author, tutorId: fixture.ids.tutorA })
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('is limited to the assigned tutor', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })

      for (const key of ['tutorB', 'author', 'manager', 'learner'] as const) {
        fixture.as(key)
        expect((await review.claimCertificateReview(cert.id)).error?.code).toBe('FORBIDDEN')
      }
      for (const key of ['outsider', 'foreignTutor'] as const) {
        fixture.as(key)
        expect((await review.claimCertificateReview(cert.id)).error?.code).toBe('NOT_FOUND')
      }
      fixture.as(null)
      expect((await review.claimCertificateReview(cert.id)).error?.code).toBe('UNAUTHORIZED')
      expect((await fixture.reload(cert.id)).status).toBe('submitted')
      expect(notifyMock).not.toHaveBeenCalled()
    })

    it('only claims submitted requests', async () => {
      fixture.as('tutorA')
      for (const status of ['draft', 'in_review', 'changes_requested', 'approved', 'rejected'] as const) {
        const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status, user: 'otherAuthor' })
        expect((await review.claimCertificateReview(cert.id)).error?.code).toBe('INVALID_STATE')
      }
    })

    it('rejects an invalid id', async () => {
      fixture.as('tutorA')
      expect((await review.claimCertificateReview(-1)).error?.code).toBe('INVALID_INPUT')
      expect((await review.claimCertificateReview(999_999_999)).error?.code).toBe('NOT_FOUND')
    })
  })

  describe('request changes', () => {
    it('stores the comments, moves the request back to the volunteer and notifies', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const { data, error } = await review.requestCertificateChanges(cert.id, {
        comment: 'Please add more detail',
        sectionComments: { experience: 'Which centre?', skills: '', tasks: 'Too generic' },
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerComment: 'Please add more detail', status: 'changes_requested' })
      const saved = await fixture.reload(cert.id)
      expect(saved.reviewedAt).not.toBeNull()
      expect(saved.reviews).toHaveLength(1)
      expect(saved.reviews[0]).toMatchObject({
        comment: 'Please add more detail',
        decision: 'changes_requested',
        reviewerId: fixture.ids.tutorA,
        sectionComments: { experience: 'Which centre?', tasks: 'Too generic' },
      })
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.changes_requested'])
      expect(events[0]?.metadata).toMatchObject({ comment: 'Please add more detail', tutorId: fixture.ids.tutorA })
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('works from submitted and accepts section comments alone', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('tutorA')
      const { data, error } = await review.requestCertificateChanges(cert.id, {
        sectionComments: { personal: 'Birth place is missing' },
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerComment: null, status: 'changes_requested' })
    })

    it('requires at least one comment', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')

      expect((await review.requestCertificateChanges(cert.id, {})).error?.code).toBe('INVALID_INPUT')
      expect(
        (await review.requestCertificateChanges(cert.id, { comment: ' ', sectionComments: { skills: '' } })).error?.code
      ).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).status).toBe('in_review')
    })

    it('is limited to the assigned tutor and to open requests', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      for (const key of ['tutorB', 'author', 'manager'] as const) {
        fixture.as(key)
        expect((await review.requestCertificateChanges(cert.id, { comment: 'Fix it' })).error?.code).toBe('FORBIDDEN')
      }

      fixture.as('tutorA')
      for (const status of ['draft', 'changes_requested', 'approved', 'rejected', 'withdrawn'] as const) {
        const other = await fixture.insertCertificate({ reviewer: 'tutorA', status, user: 'otherAuthor' })
        expect((await review.requestCertificateChanges(other.id, { comment: 'Fix it' })).error?.code).toBe(
          'INVALID_STATE'
        )
      }
    })
  })

  describe('reject', () => {
    it('rejects from every open status and records the reason', async () => {
      fixture.as('tutorA')
      for (const status of ['submitted', 'in_review', 'changes_requested'] as const) {
        const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status, user: 'otherAuthor' })
        const { data, error } = await review.rejectCertificate(cert.id, { reason })

        expect(error).toBeNull()
        expect(data).toMatchObject({ rejectedReason: reason, status: 'rejected' })
        const saved = await fixture.reload(cert.id)
        expect(saved.reviews[0]).toMatchObject({ comment: reason, decision: 'rejected' })
        const events = await fixture.eventsFor(cert.id)
        expect(events.map(({ action }) => action)).toEqual(['certificate.rejected'])
        expect(events[0]?.metadata).toMatchObject({ reason })
      }
      expect(notifyMock).toHaveBeenCalledTimes(3)
    })

    it('requires a reason of at least 10 characters', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')

      expect((await review.rejectCertificate(cert.id, { reason: 'No' })).error?.code).toBe('INVALID_INPUT')
      expect((await review.rejectCertificate(cert.id, { reason: '         ' })).error?.code).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).status).toBe('in_review')
    })

    it('is limited to the assigned tutor and to open requests', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      for (const key of ['tutorB', 'author', 'owner'] as const) {
        fixture.as(key)
        expect((await review.rejectCertificate(cert.id, { reason })).error?.code).toBe('FORBIDDEN')
      }
      fixture.as('outsider')
      expect((await review.rejectCertificate(cert.id, { reason })).error?.code).toBe('NOT_FOUND')

      fixture.as('tutorA')
      for (const status of ['draft', 'approved', 'rejected', 'withdrawn', 'revoked'] as const) {
        const other = await fixture.insertCertificate({ reviewer: 'tutorA', status, user: 'otherAuthor' })
        expect((await review.rejectCertificate(other.id, { reason })).error?.code).toBe('INVALID_STATE')
      }
    })

    it('frees the slot so the volunteer can request again', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      expect((await review.rejectCertificate(cert.id, { reason })).error).toBeNull()

      fixture.as('author')
      const created = await requests.saveCertificateDraft({
        values: {
          activityDescription: 'Helped',
          activityDuration: 120,
          activityEndDate: '2026-06-30',
          activityLocation: 'Milan',
          activityStartDate: '2026-01-10',
          language: 'en',
          rating: { experience: 4 },
          skills: fixture.courseIds.slice(0, 3).map(courseId => ({ courseId })),
          tasks: ['Welcomed new volunteers'],
        },
      })
      expect(created.data).not.toBeNull()
      const submitted = await requests.submitCertificate(created.data?.id ?? 0)
      expect(submitted.error).toBeNull()
      expect(submitted.data?.status).toBe('submitted')
    })
  })

  describe('approve', () => {
    const skillRows = async (id: number) =>
      (await fixture.reload(id)).skills.toSorted((a, b) => a.sortOrder - b.sortOrder)

    it('approves an in-review request: code, snapshot, PDF, default, review and event', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const { data, error } = await review.approveCertificate(cert.id, {
        comment: 'Well done',
        scores: { engagement: 5, evidence: 4, growth: 4, reflection: 3 },
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({ documentUrl: `https://r2.test/certificates/${cert.handle}.pdf`, status: 'approved' })
      const saved = await fixture.reload(cert.id)
      expect(saved.code).toMatch(CODE_REGEX)
      expect(saved.issuedAt).not.toBeNull()
      expect(saved.reviewedAt).not.toBeNull()
      expect(saved.isDefault).toBe(true)
      expect(saved.documentUrl).toBe(`https://r2.test/certificates/${cert.handle}.pdf`)
      expect(saved.snapshot).toMatchObject({
        activity: { duration: 120, location: 'Milan' },
        holder: { lastName: 'Tester', nationality: 'it' },
      })
      expect(saved.snapshot?.skills.map(({ level }) => level)).toEqual([4, 4, 4])
      expect((await skillRows(cert.id)).map(({ level }) => level)).toEqual([4, 4, 4])
      expect(saved.reviews).toHaveLength(1)
      expect(saved.reviews[0]).toMatchObject({
        comment: 'Well done',
        decision: 'approved',
        scoreEngagement: 5,
        scoreEvidence: 4,
        scoreGrowth: 4,
        scoreReflection: 3,
      })

      expect(putMock).toHaveBeenCalledTimes(1)
      const [key, body, type] = putMock.mock.calls[0] ?? []
      expect(key).toBe(`certificates/${cert.handle}.pdf`)
      expect(type).toBe('application/pdf')
      expect(
        Buffer.from(body as Uint8Array)
          .subarray(0, 4)
          .toString()
      ).toBe('%PDF')

      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.approved'])
      expect(events[0]?.metadata).not.toHaveProperty('documentUrl')
      expect(notifyMock).toHaveBeenCalledTimes(1)
      expect(notifyMock.mock.calls[0]?.[0]).toMatchObject({
        data: { certificateId: cert.id, documentUrl: `https://r2.test/certificates/${cert.handle}.pdf` },
        type: 'certificate.approved',
      })
    })

    it('approves a submitted request and keeps an existing code', async () => {
      const code = generateCertificateCode()
      const cert = await fixture.insertCertificate({ code, reviewer: 'tutorA', status: 'submitted' })
      fixture.as('tutorA')
      const { data, error } = await review.approveCertificate(cert.id, {})

      expect(error).toBeNull()
      expect(data?.code).toBe(code)
      expect((await fixture.reload(cert.id)).reviews[0]).toMatchObject({ scoreEngagement: null })
    })

    it('applies the tutor edits and drops the skills left out', async () => {
      const [first, second, third, fourth] = fixture.courseIds
      const cert = await fixture.insertCertificate({
        reviewer: 'tutorA',
        skills: fixture.courseIds.slice(0, 4),
        status: 'in_review',
      })
      fixture.as('tutorA')
      const { error } = await review.approveCertificate(cert.id, {
        activityLocation: 'Rome',
        skills: [
          { courseId: third ?? 0, level: 3 },
          { courseId: first ?? 0, level: 5, statement: 'Led the welcome desk' },
          { courseId: second ?? 0 },
        ],
        tasks: ['Coordinated the welcome desk'],
      })

      expect(error).toBeNull()
      const saved = await fixture.reload(cert.id)
      expect(saved.activityLocation).toBe('Rome')
      expect(saved.tasks).toEqual(['Coordinated the welcome desk'])
      const skills = await skillRows(cert.id)
      expect(skills.map(({ courseId }) => courseId)).toEqual([third, first, second])
      expect(skills.map(({ level }) => level)).toEqual([3, 5, 4])
      expect(skills[1]?.statement).toBe('Led the welcome desk')
      expect(skills.some(({ courseId }) => courseId === fourth)).toBe(false)
      expect(saved.snapshot?.activity).toMatchObject({ location: 'Rome', tasks: ['Coordinated the welcome desk'] })
      expect(saved.snapshot?.skills.map(({ courseId }) => courseId)).toEqual([third, first, second])
    })

    it('makes only the first approved certificate of a volunteer the default', async () => {
      const first = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      const second = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')

      expect((await review.approveCertificate(first.id, {})).error).toBeNull()
      expect((await review.approveCertificate(second.id, {})).error).toBeNull()
      expect((await fixture.reload(first.id)).isDefault).toBe(true)
      expect((await fixture.reload(second.id)).isDefault).toBe(false)
    })

    it('requires the four scores together when any is given', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const partial = { engagement: 4, evidence: 4 } as {
        engagement: number
        evidence: number
        growth: number
        reflection: number
      }

      expect((await review.approveCertificate(cert.id, { scores: partial })).error?.code).toBe('INVALID_INPUT')
      expect(
        (await review.approveCertificate(cert.id, { scores: { engagement: 6, evidence: 4, growth: 4, reflection: 4 } }))
          .error?.code
      ).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).status).toBe('in_review')
    })

    it('refuses levels below 2', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const [first, second, third] = fixture.courseIds

      expect(
        (
          await review.approveCertificate(cert.id, {
            skills: [{ courseId: first ?? 0, level: 1 }, { courseId: second ?? 0 }, { courseId: third ?? 0 }],
          })
        ).error?.code
      ).toBe('INVALID_INPUT')

      await fixture.db
        .update(fixture.schema.certificateSkills)
        .set({ selfLevel: 1 })
        .where(eq(fixture.schema.certificateSkills.certificateId, cert.id))
      expect((await review.approveCertificate(cert.id, {})).error?.code).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).status).toBe('in_review')
      expect(putMock).not.toHaveBeenCalled()
    })

    it('requires between 3 and 4 distinct skills that belong to the certificate', async () => {
      const cert = await fixture.insertCertificate({
        reviewer: 'tutorA',
        skills: fixture.courseIds.slice(0, 4),
        status: 'in_review',
      })
      fixture.as('tutorA')
      const [first, second, third, , fifth] = fixture.courseIds

      expect(
        (await review.approveCertificate(cert.id, { skills: [{ courseId: first ?? 0 }, { courseId: second ?? 0 }] }))
          .error?.code
      ).toBe('INVALID_INPUT')
      expect(
        (
          await review.approveCertificate(cert.id, {
            skills: [{ courseId: first ?? 0 }, { courseId: second ?? 0 }, { courseId: fifth ?? 0 }],
          })
        ).error?.code
      ).toBe('INVALID_INPUT')
      expect(
        (
          await review.approveCertificate(cert.id, {
            skills: [{ courseId: first ?? 0 }, { courseId: first ?? 0 }, { courseId: third ?? 0 }],
          })
        ).error?.code
      ).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).skills).toHaveLength(4)
      expect((await fixture.reload(cert.id)).status).toBe('in_review')
    })

    it('refuses an activity that is too short and an end date before the start date', async () => {
      const short = await fixture.insertCertificate({
        activityDuration: 40,
        activityEndDate: '2026-02-01',
        activityStartDate: '2026-01-10',
        reviewer: 'tutorA',
        status: 'in_review',
      })
      fixture.as('tutorA')
      expect((await review.approveCertificate(short.id, {})).error?.code).toBe('ACTIVITY_TOO_SHORT')

      const stored = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review', user: 'otherAuthor' })
      expect(
        (await review.approveCertificate(stored.id, { activityDuration: 40, activityEndDate: '2026-01-20' })).error
          ?.code
      ).toBe('ACTIVITY_TOO_SHORT')
      expect((await review.approveCertificate(stored.id, { activityEndDate: '2026-01-01' })).error?.code).toBe(
        'INVALID_INPUT'
      )
      expect((await fixture.reload(stored.id)).status).toBe('in_review')
      expect(putMock).not.toHaveBeenCalled()
    })

    it('is limited to the assigned tutor', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })

      for (const key of ['tutorB', 'author', 'manager', 'owner'] as const) {
        fixture.as(key)
        expect((await review.approveCertificate(cert.id, {})).error?.code).toBe('FORBIDDEN')
      }
      for (const key of ['outsider', 'foreignTutor', 'platformAdmin'] as const) {
        fixture.as(key)
        expect((await review.approveCertificate(cert.id, {})).error?.code).toBe('NOT_FOUND')
      }
      fixture.as(null)
      expect((await review.approveCertificate(cert.id, {})).error?.code).toBe('UNAUTHORIZED')
      expect((await fixture.reload(cert.id)).status).toBe('in_review')
      expect(putMock).not.toHaveBeenCalled()
    })

    it('refuses a tutor who is also the author', async () => {
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'tutor' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.otherAuthor))
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review', user: 'otherAuthor' })
      await fixture.db
        .update(fixture.schema.certificates)
        .set({ reviewerId: fixture.ids.otherAuthor })
        .where(eq(fixture.schema.certificates.id, cert.id))

      fixture.as('otherAuthor')
      expect((await review.approveCertificate(cert.id, {})).error?.code).toBe('FORBIDDEN')
    })

    it('refuses requests that are not waiting for a review', async () => {
      fixture.as('tutorA')
      for (const status of ['draft', 'changes_requested', 'approved', 'rejected', 'withdrawn', 'revoked'] as const) {
        const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status, user: 'otherAuthor' })
        expect((await review.approveCertificate(cert.id, {})).error?.code).toBe('INVALID_STATE')
      }
      expect(putMock).not.toHaveBeenCalled()
    })

    it('approves only once when called twice', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const results = await Promise.all([
        review.approveCertificate(cert.id, {}),
        review.approveCertificate(cert.id, {}),
      ])

      expect(results.filter(({ error }) => error === null)).toHaveLength(1)
      expect(results.filter(({ error }) => error?.code === 'INVALID_STATE')).toHaveLength(1)
      expect(putMock).toHaveBeenCalledTimes(1)
      expect((await fixture.reload(cert.id)).reviews).toHaveLength(1)
      expect(await fixture.eventsFor(cert.id)).toHaveLength(1)

      const again = await review.approveCertificate(cert.id, {})
      expect(again.error?.code).toBe('INVALID_STATE')
    })

    it('reverts the whole approval when the PDF cannot be stored, then succeeds on retry', async () => {
      const cert = await fixture.insertCertificate({
        reviewer: 'tutorA',
        skills: fixture.courseIds.slice(0, 4),
        status: 'in_review',
      })
      const before = await fixture.reload(cert.id)
      const [first, second, third] = fixture.courseIds
      putMock.mockRejectedValueOnce(new Error('R2 unavailable'))
      fixture.as('tutorA')

      const failed = await review.approveCertificate(cert.id, {
        activityLocation: 'Rome',
        comment: 'Good',
        scores: { engagement: 5, evidence: 5, growth: 5, reflection: 5 },
        skills: [{ courseId: first ?? 0, level: 5 }, { courseId: second ?? 0 }, { courseId: third ?? 0 }],
        tasks: ['Changed task'],
      })

      expect(failed.data).toBeNull()
      expect(failed.error?.code).toBe('STORAGE_FAILED')
      const after = await fixture.reload(cert.id)
      expect(after).toMatchObject({
        activityLocation: before.activityLocation,
        code: null,
        documentUrl: null,
        isDefault: false,
        issuedAt: null,
        reviewedAt: before.reviewedAt,
        snapshot: null,
        status: 'in_review',
        tasks: before.tasks,
      })
      expect(after.reviews).toEqual([])
      expect(plainSkills(after.skills)).toEqual(plainSkills(before.skills))
      expect(await fixture.eventsFor(cert.id)).toEqual([])
      expect(notifyMock).not.toHaveBeenCalled()
      expect(deleteMock).toHaveBeenCalledWith(`certificates/${cert.handle}.pdf`)

      const retried = await review.approveCertificate(cert.id, {})
      expect(retried.error).toBeNull()
      expect(retried.data?.status).toBe('approved')
      expect((await fixture.reload(cert.id)).skills).toHaveLength(4)
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('expires the certificate caches when the PDF cannot be stored and the revert fails too', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      putMock.mockImplementationOnce(async () => {
        await fixture.db
          .update(fixture.schema.certificates)
          .set({ issuedAt: '2001-01-01 00:00:00' })
          .where(eq(fixture.schema.certificates.id, cert.id))
        throw new Error('R2 unavailable')
      })
      vi.mocked(updateTag).mockClear()
      fixture.as('tutorA')

      const failed = await review.approveCertificate(cert.id, {})

      expect(failed.error?.code).toBe('STORAGE_FAILED')
      expect(failed.error?.message).toContain('could not be undone')
      expect((await fixture.reload(cert.id)).status).toBe('approved')
      const tags = vi.mocked(updateTag).mock.calls.map(([tag]) => tag)
      expect(tags).toContain(certificatesOrgTag(fixture.organizationId))
      expect(tags).toContain(certificatesUserTag(fixture.ids.author))
      expect(tags).toContain(certificatesTutorTag(fixture.ids.tutorA))
    })
  })

  describe('preview', () => {
    it('renders the pdf of the pending edits without changing anything', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const { data, error } = await review.previewCertificatePdf(cert.id, {
        skills: fixture.courseIds.slice(0, 3).map(courseId => ({ courseId, level: 5, statement: 'Led the desk' })),
        tasks: ['Welcomed new volunteers'],
      })

      expect(error).toBeNull()
      expect(
        Buffer.from(data?.pdf ?? '', 'base64')
          .subarray(0, 4)
          .toString()
      ).toBe('%PDF')
      const saved = await fixture.reload(cert.id)
      expect(saved).toMatchObject({ code: null, documentUrl: null, snapshot: null, status: 'in_review' })
      expect(saved.reviews).toHaveLength(0)
      expect(await fixture.eventsFor(cert.id)).toEqual([])
      expect(putMock).not.toHaveBeenCalled()
      expect(notifyMock).not.toHaveBeenCalled()
    })

    it('applies the same rules as an approval', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('tutorA')
      const low = await review.previewCertificatePdf(cert.id, {
        skills: fixture.courseIds.slice(0, 3).map(courseId => ({ courseId, level: 1 })),
      })
      expect(low.error?.code).toBe('INVALID_INPUT')
      const short = await review.previewCertificatePdf(cert.id, { activityDuration: 10, activityEndDate: '2026-01-20' })
      expect(short.error?.code).toBe('ACTIVITY_TOO_SHORT')
    })

    it('is limited to the assigned tutor and to requests waiting for a review', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      for (const key of ['tutorB', 'author', 'manager'] as const) {
        fixture.as(key)
        expect((await review.previewCertificatePdf(cert.id, {})).error?.code).toBe('FORBIDDEN')
      }
      fixture.as('outsider')
      expect((await review.previewCertificatePdf(cert.id, {})).error?.code).toBe('NOT_FOUND')

      const approved = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'approved', user: 'otherAuthor' })
      fixture.as('tutorA')
      expect((await review.previewCertificatePdf(approved.id, {})).error?.code).toBe('INVALID_STATE')
    })
  })

  describe('revoke', () => {
    const approved = async (user: 'author' | 'otherAuthor' = 'author', issuedAt = '2026-07-01 10:00:00') => {
      const cert = await fixture.insertCertificate({
        code: generateCertificateCode(),
        reviewer: 'tutorA',
        status: 'approved',
        user,
      })
      await fixture.db
        .update(fixture.schema.certificates)
        .set({ issuedAt, reviewedAt: issuedAt })
        .where(eq(fixture.schema.certificates.id, cert.id))
      return cert
    }

    const setDefault = async (id: number, isDefault: boolean) => {
      await fixture.db
        .update(fixture.schema.certificates)
        .set({ isDefault })
        .where(eq(fixture.schema.certificates.id, id))
    }

    it('lets managers and platform admins revoke with a reason', async () => {
      for (const key of ['manager', 'owner', 'platformAdmin'] as const) {
        const cert = await approved()
        await setDefault(cert.id, true)
        fixture.as(key)
        const { data, error } = await review.revokeCertificate(cert.id, { reason })

        expect(error).toBeNull()
        expect(data).toMatchObject({
          isDefault: false,
          revokedById: fixture.ids[key],
          revokedReason: reason,
          status: 'revoked',
        })
        expect(data?.revokedAt).not.toBeNull()
        const events = await fixture.eventsFor(cert.id)
        expect(events.map(({ action }) => action)).toEqual(['certificate.revoked'])
        expect(events[0]?.metadata).toMatchObject({ holderId: fixture.ids.author, reason })
      }
      expect(notifyMock).toHaveBeenCalledTimes(3)
    })

    it('keeps the PDF in storage', async () => {
      const cert = await approved()
      fixture.as('manager')
      expect((await review.revokeCertificate(cert.id, { reason })).error).toBeNull()
      expect(deleteMock).not.toHaveBeenCalled()
    })

    it('denies tutors, volunteers and outsiders', async () => {
      const cert = await approved()

      for (const key of ['tutorA', 'tutorB', 'author', 'learner'] as const) {
        fixture.as(key)
        expect((await review.revokeCertificate(cert.id, { reason })).error?.code).toBe('FORBIDDEN')
      }
      for (const key of ['outsider', 'foreignTutor'] as const) {
        fixture.as(key)
        expect((await review.revokeCertificate(cert.id, { reason })).error?.code).toBe('NOT_FOUND')
      }
      fixture.as(null)
      expect((await review.revokeCertificate(cert.id, { reason })).error?.code).toBe('UNAUTHORIZED')
      expect((await fixture.reload(cert.id)).status).toBe('approved')
    })

    it('only revokes approved certificates', async () => {
      fixture.as('manager')
      for (const status of [
        'draft',
        'submitted',
        'in_review',
        'changes_requested',
        'rejected',
        'withdrawn',
        'revoked',
      ] as const) {
        const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status, user: 'otherAuthor' })
        expect((await review.revokeCertificate(cert.id, { reason })).error?.code).toBe('INVALID_STATE')
      }
    })

    it('requires a reason of at least 10 characters', async () => {
      const cert = await approved()
      fixture.as('manager')

      expect((await review.revokeCertificate(cert.id, { reason: 'Mistake' })).error?.code).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).status).toBe('approved')
    })

    it('promotes the latest approved certificate when the default is revoked', async () => {
      const oldest = await approved('author', '2026-05-01 10:00:00')
      const latest = await approved('author', '2026-09-01 10:00:00')
      const middle = await approved('author', '2026-07-01 10:00:00')
      await setDefault(oldest.id, true)
      fixture.as('manager')

      expect((await review.revokeCertificate(oldest.id, { reason })).error).toBeNull()
      expect((await fixture.reload(oldest.id)).isDefault).toBe(false)
      expect((await fixture.reload(latest.id)).isDefault).toBe(true)
      expect((await fixture.reload(middle.id)).isDefault).toBe(false)
    })

    it('leaves the default untouched when another certificate is revoked', async () => {
      const kept = await approved('author', '2026-05-01 10:00:00')
      const other = await approved('author', '2026-09-01 10:00:00')
      await setDefault(kept.id, true)
      fixture.as('manager')

      expect((await review.revokeCertificate(other.id, { reason })).error).toBeNull()
      expect((await fixture.reload(kept.id)).isDefault).toBe(true)
    })
  })
})
