import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type Fixture,
  createFixture,
  isLocalDatabase,
  notifyMock,
  session,
  stubCourses,
} from '@/actions/certificates/test-harness'
import { MAX_CERTIFICATE_DRAFTS } from '@/db/mutations/certificate'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', async () => (await import('@/actions/certificates/test-harness')).mocks.auth)
vi.mock('@/actions/user', async () => (await import('@/actions/certificates/test-harness')).mocks.user)
vi.mock('@/actions/courses/queries', async () => (await import('@/actions/certificates/test-harness')).mocks.courses)
vi.mock(
  '@/actions/admin/impersonation-state',
  async () => (await import('@/actions/certificates/test-harness')).mocks.impersonation
)
vi.mock(
  '@/actions/notifications/notify',
  async () => (await import('@/actions/certificates/test-harness')).mocks.notify
)
vi.mock('@/lib/rate-limit', async () => (await import('@/actions/certificates/test-harness')).mocks.rateLimit)

describe.skipIf(!isLocalDatabase)('certificate requests', () => {
  let fixture: Fixture
  let requests: typeof import('@/actions/certificates/requests')

  const values = (overrides: Record<string, unknown> = {}) => ({
    activityDescription: 'Helped at the community centre',
    activityDuration: 120,
    activityEndDate: '2026-06-30',
    activityLocation: 'Milan',
    activityStartDate: '2026-01-10',
    language: 'en',
    rating: { experience: 4 },
    skills: fixture.courseIds.slice(0, 3).map(courseId => ({ courseId })),
    tasks: ['Welcomed new volunteers', 'Organized weekly activities'],
    ...overrides,
  })

  const draft = async (overrides: Record<string, unknown> = {}) => {
    const { data, error } = await requests.saveCertificateDraft({ values: values(overrides) })
    expect(error).toBeNull()
    if (!data) throw new Error('Draft was not saved')
    return data
  }

  beforeAll(async () => {
    fixture = await createFixture()
    requests = await import('@/actions/certificates/requests')
  })

  beforeEach(async () => {
    await fixture.reset()
    fixture.as('author')
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  describe('drafts', () => {
    it('creates a draft for a volunteer in the active organization without recording an event', async () => {
      const created = await draft()

      expect(created).toMatchObject({
        organizationId: fixture.organizationId,
        reviewerId: null,
        status: 'draft',
        userId: fixture.ids.author,
      })
      const saved = await fixture.reload(created.id)
      expect(saved.skills.map(({ courseId }) => courseId)).toEqual(fixture.courseIds.slice(0, 3))
      expect(saved.tasks).toHaveLength(2)
      expect(await fixture.eventsFor(created.id)).toEqual([])
      expect(notifyMock).not.toHaveBeenCalled()
    })

    it('saves partial values and updates the same draft by id', async () => {
      const created = await draft({ activityLocation: '', skills: [], tasks: [] })
      const { data, error } = await requests.saveCertificateDraft({
        id: created.id,
        values: { activityLocation: 'Rome', skills: [{ courseId: fixture.courseIds[1]!, evidence: 'Led a team' }] },
      })

      expect(error).toBeNull()
      expect(data?.id).toBe(created.id)
      const saved = await fixture.reload(created.id)
      expect(saved.activityLocation).toBe('Rome')
      expect(saved.skills).toHaveLength(1)
      expect(saved.skills[0]).toMatchObject({ courseId: fixture.courseIds[1], evidence: 'Led a team' })
    })

    it('stores the anonymous rating once per certificate', async () => {
      const created = await draft()
      const result = await requests.saveCertificateDraft({
        id: created.id,
        values: { rating: { comment: 'Warm team', experience: 5 } },
      })
      expect(result.error).toBeNull()

      const ratings = await fixture.db.query.organizationRatings.findMany({
        where: eq(fixture.schema.organizationRatings.certificateId, created.id),
      })
      expect(ratings).toHaveLength(1)
      expect(ratings[0]).toMatchObject({ comment: 'Warm team', experience: 5 })
    })

    it('requires a signed-in volunteer', async () => {
      fixture.as(null)
      expect((await requests.saveCertificateDraft({ values: values() })).error?.code).toBe('UNAUTHORIZED')

      for (const key of ['learner', 'tutorA', 'manager', 'owner', 'outsider'] as const) {
        fixture.as(key)
        expect((await requests.saveCertificateDraft({ values: values() })).error?.code).toBe('FORBIDDEN')
      }
    })

    it('rejects invalid values and skills that are not completed skill courses', async () => {
      const tooLong = await requests.saveCertificateDraft({ values: values({ tasks: ['x'.repeat(111)] }) })
      expect(tooLong.error?.code).toBe('INVALID_INPUT')

      const tooMany = await requests.saveCertificateDraft({
        values: values({ skills: fixture.courseIds.map(courseId => ({ courseId })) }),
      })
      expect(tooMany.error?.code).toBe('INVALID_INPUT')

      session.courses = stubCourses(fixture.courseIds.slice(0, 2))
      const unfinished = await requests.saveCertificateDraft({ values: values() })
      expect(unfinished.error).toMatchObject({
        code: 'INVALID_INPUT',
        message: 'Skills must be completed skill courses',
      })
    })

    it('caps the drafts per organization', async () => {
      for (let index = 0; index < MAX_CERTIFICATE_DRAFTS; index += 1) await draft()
      expect((await requests.saveCertificateDraft({ values: values() })).error?.code).toBe('CONFLICT')
    })

    it('hides drafts from other users', async () => {
      const created = await draft()
      fixture.as('otherAuthor')
      const update = await requests.saveCertificateDraft({ id: created.id, values: { activityLocation: 'Rome' } })
      expect(update.error?.code).toBe('NOT_FOUND')
      expect((await requests.deleteCertificateDraft(created.id)).error?.code).toBe('NOT_FOUND')
    })

    it('deletes a draft together with its skills, but never a submitted request', async () => {
      const created = await draft()
      expect((await requests.deleteCertificateDraft(created.id)).error).toBeNull()
      expect(
        await fixture.db.query.certificates.findFirst({ where: eq(fixture.schema.certificates.id, created.id) })
      ).toBeUndefined()
      expect(
        await fixture.db.query.certificateSkills.findMany({
          where: eq(fixture.schema.certificateSkills.certificateId, created.id),
        })
      ).toEqual([])

      const submitted = await fixture.insertCertificate({ status: 'submitted' })
      expect((await requests.deleteCertificateDraft(submitted.id)).error?.code).toBe('NOT_FOUND')
      expect((await fixture.reload(submitted.id)).status).toBe('submitted')
    })
  })

  describe('submit', () => {
    it('submits a complete draft: assigns a code and a tutor, records the event and notifies', async () => {
      const created = await draft()
      const { data, error } = await requests.submitCertificate(created.id)

      expect(error).toBeNull()
      expect(data?.status).toBe('submitted')
      expect(data?.code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/u)
      expect(data?.submittedAt).not.toBeNull()
      expect([fixture.ids.tutorA, fixture.ids.tutorB, fixture.ids.tutorC]).toContain(data?.reviewerId)

      const events = await fixture.eventsFor(created.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.submitted'])
      expect(events[0]).toMatchObject({ actorId: fixture.ids.author, organizationId: fixture.organizationId })
      expect(events[0]?.metadata).toMatchObject({ holderId: fixture.ids.author, tutorId: data?.reviewerId })
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('derives the self level of each skill from the course assessments', async () => {
      session.courses = stubCourses(fixture.courseIds, 5)
      const created = await draft()
      await requests.submitCertificate(created.id)

      const saved = await fixture.reload(created.id)
      expect(saved.skills.map(({ selfLevel }) => selfLevel)).toEqual([5, 5, 5])
    })

    it('keeps a self level the volunteer chose', async () => {
      const created = await draft({
        skills: fixture.courseIds
          .slice(0, 3)
          .map((courseId, index) => ({ courseId, evidence: 'Example', selfLevel: index + 2 })),
      })
      await requests.submitCertificate(created.id)

      const saved = await fixture.reload(created.id)
      expect(saved.skills.map(({ selfLevel }) => selfLevel)).toEqual([2, 3, 4])
    })

    it('sends the request to the pool when the organization has no available tutor', async () => {
      const created = await draft()
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'volunteer' })
        .where(eq(fixture.schema.memberships.organizationId, fixture.organizationId))
      const { data } = await requests.submitCertificate(created.id)

      expect(data).toMatchObject({ reviewerId: null, status: 'submitted' })
      expect((await fixture.eventsFor(created.id))[0]?.metadata).toMatchObject({ tutorId: null })
    })

    it('rejects drafts that are incomplete', async () => {
      const noTasks = await draft({ tasks: [] })
      expect((await requests.submitCertificate(noTasks.id)).error?.code).toBe('INVALID_INPUT')

      const twoSkills = await draft({ skills: fixture.courseIds.slice(0, 2).map(courseId => ({ courseId })) })
      expect((await requests.submitCertificate(twoSkills.id)).error?.code).toBe('INVALID_INPUT')

      const noRating = await draft({ rating: {} })
      expect((await requests.submitCertificate(noRating.id)).error?.code).toBe('INVALID_INPUT')

      const backwards = await draft({ activityEndDate: '2025-01-01' })
      expect((await requests.submitCertificate(backwards.id)).error?.code).toBe('INVALID_INPUT')

      expect((await fixture.reload(noTasks.id)).status).toBe('draft')
      expect(notifyMock).not.toHaveBeenCalled()
    })

    it('requires the learning eligibility of D8', async () => {
      const created = await draft()

      session.courses = stubCourses(fixture.courseIds, 2)
      expect((await requests.submitCertificate(created.id)).error?.code).toBe('NOT_ELIGIBLE')

      session.courses = stubCourses(fixture.courseIds.slice(0, 2))
      expect((await requests.submitCertificate(created.id)).error?.code).toBe('INVALID_INPUT')

      session.courses = stubCourses(fixture.courseIds, 3)
      expect((await requests.submitCertificate(created.id)).error).toBeNull()
    })

    it('applies the activity rule of 100 hours or 3 months', async () => {
      const short = await draft({
        activityDuration: 99,
        activityEndDate: '2026-03-30',
        activityStartDate: '2026-01-01',
      })
      expect((await requests.submitCertificate(short.id)).error?.code).toBe('ACTIVITY_TOO_SHORT')

      await requests.saveCertificateDraft({ id: short.id, values: { activityDuration: 100 } })
      expect((await requests.submitCertificate(short.id)).error).toBeNull()

      const months = await draft({
        activityDuration: 20,
        activityEndDate: '2026-03-31',
        activityStartDate: '2026-01-01',
      })
      expect((await requests.submitCertificate(months.id)).error?.code).toBe('CONFLICT')
      await requests.withdrawCertificate(short.id)
      expect((await requests.submitCertificate(months.id)).error).toBeNull()
    })

    it('requires the personal data and saves what the volunteer fills in', async () => {
      await fixture.db
        .update(fixture.schema.users)
        .set({ birthPlace: null, nationality: null })
        .where(eq(fixture.schema.users.id, fixture.ids.author))
      const created = await draft()

      const missing = await requests.submitCertificate(created.id)
      expect(missing.error).toMatchObject({ code: 'PERSONAL_DATA_MISSING' })
      expect(missing.error?.message).toContain('birthPlace')
      expect(missing.error?.message).toContain('nationality')

      const invalid = await requests.submitCertificate(created.id, { nationality: 'Italy' })
      expect(invalid.error?.code).toBe('INVALID_INPUT')

      const filled = await requests.submitCertificate(created.id, { birthPlace: 'Turin', nationality: 'ES' })
      expect(filled.error).toBeNull()
      const holder = await fixture.db.query.users.findFirst({ where: eq(fixture.schema.users.id, fixture.ids.author) })
      expect(holder).toMatchObject({ birthPlace: 'Turin', nationality: 'es' })
    })

    it('allows one open request per user and organization (D4)', async () => {
      const first = await draft()
      const second = await draft()
      expect((await requests.submitCertificate(first.id)).error).toBeNull()

      const blocked = await requests.submitCertificate(second.id)
      expect(blocked.error?.code).toBe('CONFLICT')
      expect((await fixture.reload(second.id)).status).toBe('draft')

      await fixture.db
        .update(fixture.schema.certificates)
        .set({ status: 'approved' })
        .where(eq(fixture.schema.certificates.id, first.id))
      expect((await requests.submitCertificate(second.id)).error).toBeNull()
    })

    it('blocks the second of two simultaneous submissions', async () => {
      const first = await draft()
      const second = await draft()
      const results = await Promise.all([requests.submitCertificate(first.id), requests.submitCertificate(second.id)])

      expect(results.filter(({ error }) => error === null)).toHaveLength(1)
      expect(results.filter(({ error }) => error?.code === 'CONFLICT')).toHaveLength(1)
    })

    it('only submits drafts of the signed-in volunteer', async () => {
      const created = await draft()
      fixture.as('otherAuthor')
      expect((await requests.submitCertificate(created.id)).error?.code).toBe('NOT_FOUND')

      fixture.as('author')
      expect((await requests.submitCertificate(created.id)).error).toBeNull()
      expect((await requests.submitCertificate(created.id)).error?.code).toBe('INVALID_STATE')
    })

    it('stops volunteers who lost their role', async () => {
      const created = await draft()
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'learner' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.author))
      expect((await requests.submitCertificate(created.id)).error?.code).toBe('FORBIDDEN')
    })
  })

  describe('feature', () => {
    it('moves the featured flag to another approved certificate of the author', async () => {
      const first = await fixture.insertCertificate({ code: 'LANE-A-FEAT-0001', status: 'approved' })
      const second = await fixture.insertCertificate({ code: 'LANE-A-FEAT-0002', status: 'approved' })
      await fixture.db
        .update(fixture.schema.certificates)
        .set({ isDefault: true })
        .where(eq(fixture.schema.certificates.id, first.id))

      const { error } = await requests.featureCertificate(second.id)

      expect(error).toBeNull()
      expect((await fixture.reload(first.id)).isDefault).toBe(false)
      expect((await fixture.reload(second.id)).isDefault).toBe(true)
    })

    it('rejects unapproved and foreign certificates', async () => {
      const open = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      expect((await requests.featureCertificate(open.id)).error?.code).toBe('INVALID_STATE')

      const approved = await fixture.insertCertificate({ code: 'LANE-A-FEAT-0003', status: 'approved' })
      fixture.as('otherAuthor')
      expect((await requests.featureCertificate(approved.id)).error?.code).toBe('NOT_FOUND')
      expect((await fixture.reload(approved.id)).isDefault).toBe(false)
    })
  })

  describe('withdraw', () => {
    it.each(['submitted', 'in_review', 'changes_requested'] as const)('withdraws a %s request', async status => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status })
      const { data, error } = await requests.withdrawCertificate(cert.id)

      expect(error).toBeNull()
      expect(data).toMatchObject({ status: 'withdrawn' })
      expect(data?.withdrawnAt).not.toBeNull()
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.withdrawn'])
      expect(events[0]?.metadata).toMatchObject({ tutorId: fixture.ids.tutorA })
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it.each(['draft', 'approved', 'rejected', 'withdrawn', 'revoked'] as const)(
      'cannot withdraw a %s request',
      async status => {
        const cert = await fixture.insertCertificate({ status })
        expect((await requests.withdrawCertificate(cert.id)).error?.code).toBe('INVALID_STATE')
        expect((await fixture.reload(cert.id)).status).toBe(status)
      }
    )

    it("cannot withdraw someone else's request", async () => {
      const cert = await fixture.insertCertificate({ status: 'submitted' })
      fixture.as('otherAuthor')
      expect((await requests.withdrawCertificate(cert.id)).error?.code).toBe('NOT_FOUND')
      fixture.as('tutorA')
      expect((await requests.withdrawCertificate(cert.id)).error?.code).toBe('NOT_FOUND')
    })

    it('frees the slot for a new request', async () => {
      const first = await draft()
      await requests.submitCertificate(first.id)
      const second = await draft()
      expect((await requests.submitCertificate(second.id)).error?.code).toBe('CONFLICT')

      await requests.withdrawCertificate(first.id)
      expect((await requests.submitCertificate(second.id)).error).toBeNull()
    })
  })

  describe('resubmit', () => {
    it('returns the request to the same tutor, clears the comment and records the event', async () => {
      const cert = await fixture.insertCertificate({
        code: 'AAAA-BBBB-CCCC',
        reviewer: 'tutorB',
        status: 'changes_requested',
      })
      await fixture.db
        .update(fixture.schema.certificates)
        .set({ reviewerComment: 'Please add detail' })
        .where(eq(fixture.schema.certificates.id, cert.id))

      const { data, error } = await requests.resubmitCertificate(cert.id, {
        activityLocation: 'Rome',
        tasks: ['Welcomed new volunteers', 'Organized weekly activities', 'Ran the summer camp'],
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({
        activityLocation: 'Rome',
        code: 'AAAA-BBBB-CCCC',
        reviewerComment: null,
        reviewerId: fixture.ids.tutorB,
        status: 'submitted',
      })
      expect(data?.tasks).toHaveLength(3)
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.resubmitted'])
      expect(events[0]?.metadata).toMatchObject({ tutorId: fixture.ids.tutorB })
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('picks a tutor again when the previous one is no longer available', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorB', status: 'changes_requested' })
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'volunteer' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.tutorB))

      const { data } = await requests.resubmitCertificate(cert.id)
      expect(data?.reviewerId).not.toBe(fixture.ids.tutorB)
      expect([fixture.ids.tutorA, fixture.ids.tutorC]).toContain(data?.reviewerId)
    })

    it('validates the merged values again', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorB', status: 'changes_requested' })
      expect((await requests.resubmitCertificate(cert.id, { tasks: ['x'.repeat(111)] })).error?.code).toBe(
        'INVALID_INPUT'
      )
      expect(
        (await requests.resubmitCertificate(cert.id, { activityDuration: 10, activityEndDate: '2026-01-20' })).error
          ?.code
      ).toBe('ACTIVITY_TOO_SHORT')
      expect((await fixture.reload(cert.id)).status).toBe('changes_requested')
    })

    it.each(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'withdrawn', 'revoked'] as const)(
      'cannot resubmit a %s request',
      async status => {
        const cert = await fixture.insertCertificate({ reviewer: 'tutorB', status })
        expect((await requests.resubmitCertificate(cert.id)).error?.code).toBe('INVALID_STATE')
      }
    )

    it("cannot resubmit someone else's request", async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorB', status: 'changes_requested' })
      fixture.as('otherAuthor')
      expect((await requests.resubmitCertificate(cert.id)).error?.code).toBe('NOT_FOUND')
    })
  })
})
