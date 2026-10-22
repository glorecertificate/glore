import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase, notifyMock } from '@/actions/certificates/test-harness'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', async () => (await import('@/actions/certificates/test-harness')).mocks.auth)
vi.mock('@/actions/user', async () => (await import('@/actions/certificates/test-harness')).mocks.user)
vi.mock('@/actions/courses/queries', async () => (await import('@/actions/certificates/test-harness')).mocks.courses)
vi.mock(
  '@/actions/notifications/notify',
  async () => (await import('@/actions/certificates/test-harness')).mocks.notify
)
vi.mock('@/lib/rate-limit', async () => (await import('@/actions/certificates/test-harness')).mocks.rateLimit)

describe.skipIf(!isLocalDatabase)('certificate assignment', () => {
  let fixture: Fixture
  let assignment: typeof import('@/actions/certificates/assignment')
  let requests: typeof import('@/actions/certificates/requests')
  let queries: typeof import('@/actions/certificates/queries')
  let mutations: typeof import('@/db/mutations/certificate')

  beforeAll(async () => {
    fixture = await createFixture()
    assignment = await import('@/actions/certificates/assignment')
    requests = await import('@/actions/certificates/requests')
    queries = await import('@/actions/certificates/queries')
    mutations = await import('@/db/mutations/certificate')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  const submitAs = async (key: 'author' | 'otherAuthor') => {
    fixture.as(key)
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
    if (!created.data) throw new Error(created.error?.message)
    const submitted = await requests.submitCertificate(created.data.id)
    if (!submitted.data) throw new Error(submitted.error?.message)
    return submitted.data
  }

  const recordAssignment = async (tutor: 'tutorA' | 'tutorB' | 'tutorC', createdAt: string) => {
    await fixture.db.insert(fixture.schema.activityEvents).values({
      action: 'certificate.assigned',
      createdAt,
      metadata: { tutorId: fixture.ids[tutor] },
      organizationId: fixture.organizationId,
      subjectId: '0',
      subjectType: 'certificate',
    })
  }

  describe('load balancing (A1b)', () => {
    it('picks the tutor with the fewest open requests and ignores closed ones', async () => {
      await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review', user: 'otherAuthor' })
      await fixture.insertCertificate({ reviewer: 'tutorA', status: 'changes_requested', user: 'otherAuthor' })
      await fixture.insertCertificate({ reviewer: 'tutorB', status: 'submitted', user: 'otherAuthor' })
      for (const status of ['approved', 'rejected', 'withdrawn', 'revoked'] as const) {
        await fixture.insertCertificate({ reviewer: 'tutorC', status, user: 'otherAuthor' })
      }

      expect((await submitAs('author')).reviewerId).toBe(fixture.ids.tutorC)
    })

    it('breaks ties with the oldest last assignment', async () => {
      await recordAssignment('tutorA', '2026-10-03 10:00:00')
      await recordAssignment('tutorB', '2026-10-01 10:00:00')
      await recordAssignment('tutorC', '2026-10-02 10:00:00')

      expect((await submitAs('author')).reviewerId).toBe(fixture.ids.tutorB)
      expect((await submitAs('otherAuthor')).reviewerId).toBe(fixture.ids.tutorC)
    })

    it('treats a tutor who was never assigned as the oldest', async () => {
      await recordAssignment('tutorA', '2026-10-01 10:00:00')
      await recordAssignment('tutorB', '2026-10-02 10:00:00')

      expect((await submitAs('author')).reviewerId).toBe(fixture.ids.tutorC)
    })

    it('counts a manual assignment as a recent assignment', async () => {
      await recordAssignment('tutorA', '2026-10-01 10:00:00')
      await recordAssignment('tutorB', '2026-10-02 10:00:00')
      await recordAssignment('tutorC', '2026-10-03 10:00:00')
      const first = await submitAs('author')
      expect(first.reviewerId).toBe(fixture.ids.tutorA)

      await requests.withdrawCertificate(first.id)
      fixture.as('manager')
      const waiting = await fixture.insertCertificate({ status: 'submitted', user: 'otherAuthor' })
      expect((await assignment.assignCertificateTutor(waiting.id, fixture.ids.tutorA)).error).toBeNull()

      expect((await submitAs('author')).reviewerId).toBe(fixture.ids.tutorB)
    })

    it('skips banned tutors and tutors of other organizations', async () => {
      await fixture.db
        .update(fixture.schema.users)
        .set({ banned: true })
        .where(eq(fixture.schema.users.id, fixture.ids.tutorC))
      await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted', user: 'otherAuthor' })
      await fixture.insertCertificate({ reviewer: 'tutorB', status: 'submitted', user: 'otherAuthor' })

      const picked = (await submitAs('author')).reviewerId
      expect([fixture.ids.tutorA, fixture.ids.tutorB]).toContain(picked)
      expect(picked).not.toBe(fixture.ids.foreignTutor)
    })

    it('never offers the author as a reviewer', async () => {
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'tutor' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.otherAuthor))

      const loads = await mutations.tutorLoads(fixture.db, fixture.organizationId, fixture.ids.otherAuthor)
      expect(loads.map(({ userId }) => userId).toSorted()).toEqual(
        [fixture.ids.tutorA, fixture.ids.tutorB, fixture.ids.tutorC].toSorted()
      )
    })

    it('leaves the request in the pool without an available tutor', async () => {
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'volunteer' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.tutorA))
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'volunteer' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.tutorB))
      await fixture.db
        .update(fixture.schema.users)
        .set({ banned: true })
        .where(eq(fixture.schema.users.id, fixture.ids.tutorC))

      expect((await submitAs('author')).reviewerId).toBeNull()
    })
  })

  describe('queue scoping (A1b)', () => {
    const idsOf = (data: { id: number }[] | null) => (data ?? []).map(({ id }) => id).toSorted((a, b) => a - b)

    it("lists a tutor's assigned certificates of the active organization only", async () => {
      await fixture.db
        .insert(fixture.schema.memberships)
        .values({ organizationId: fixture.otherOrganizationId, role: 'tutor', userId: fixture.ids.tutorA })
      const inA = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      const doneInA = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'approved', user: 'otherAuthor' })
      const inB = await fixture.insertCertificate({
        organization: fixture.otherOrganizationId,
        reviewer: 'tutorA',
        status: 'submitted',
      })
      await fixture.insertCertificate({ reviewer: 'tutorB', status: 'submitted', user: 'otherAuthor' })
      await fixture.insertCertificate({ reviewer: 'tutorA', status: 'draft', user: 'otherAuthor' })

      fixture.as('tutorA')
      for (const cache of [false, true]) {
        const inActive = await queries.listTutorCertificates({ cache })
        expect(idsOf(inActive.data)).toEqual([inA.id, doneInA.id].toSorted((a, b) => a - b))
      }

      const { session } = await import('@/actions/certificates/test-harness')
      session.organizationId = fixture.otherOrganizationId
      expect(idsOf((await queries.listTutorCertificates({ cache: false })).data)).toEqual([inB.id])
    })

    it('shows the queue only to tutors of the active organization', async () => {
      await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })

      for (const key of ['author', 'manager', 'foreignTutor'] as const) {
        fixture.as(key)
        expect((await queries.listTutorCertificates({ cache: false })).data).toEqual([])
      }
    })

    it('lists unassigned submitted certificates of the active organization, without the viewer own and drafts', async () => {
      const pool = await fixture.insertCertificate({ status: 'submitted' })
      const own = await fixture.insertCertificate({ status: 'submitted', user: 'otherAuthor' })
      await fixture.insertCertificate({ reviewer: 'tutorB', status: 'submitted', user: 'otherAuthor' })
      await fixture.insertCertificate({ status: 'draft', user: 'otherAuthor' })
      await fixture.insertCertificate({ status: 'in_review', user: 'otherAuthor' })
      await fixture.insertCertificate({ organization: fixture.otherOrganizationId, status: 'submitted' })

      fixture.as('tutorA')
      expect(idsOf((await queries.listUnassignedOrgCertificates({ cache: false })).data)).toEqual(
        [pool.id, own.id].toSorted((a, b) => a - b)
      )

      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'tutor' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.otherAuthor))
      fixture.as('otherAuthor')
      expect(idsOf((await queries.listUnassignedOrgCertificates({ cache: false })).data)).toEqual([pool.id])

      fixture.as('manager')
      expect(idsOf((await queries.listUnassignedOrgCertificates({ cache: true })).data)).toHaveLength(2)

      fixture.as('author')
      expect((await queries.listUnassignedOrgCertificates({ cache: false })).data).toEqual([])
    })

    it('keeps drafts private to their author', async () => {
      const draft = await fixture.insertCertificate({ status: 'draft' })
      const open = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review', user: 'otherAuthor' })

      for (const key of ['manager', 'owner', 'tutorA', 'platformAdmin'] as const) {
        fixture.as(key)
        expect((await queries.findCertificate(draft.id)).error).not.toBeNull()
      }
      fixture.as('author')
      expect((await queries.findCertificate(draft.id)).data?.id).toBe(draft.id)

      for (const key of ['tutorA', 'manager', 'owner', 'platformAdmin', 'otherAuthor'] as const) {
        fixture.as(key)
        expect((await queries.findCertificate(open.id)).data?.id).toBe(open.id)
      }
      for (const key of ['tutorB', 'author', 'outsider', 'foreignTutor', 'learner'] as const) {
        fixture.as(key)
        expect((await queries.findCertificate(open.id)).error).not.toBeNull()
      }
    })

    it('lets tutors of the organization open an unassigned request', async () => {
      const pool = await fixture.insertCertificate({ status: 'submitted' })

      fixture.as('tutorB')
      expect((await queries.findCertificate(pool.id)).data?.id).toBe(pool.id)
      fixture.as('foreignTutor')
      expect((await queries.findCertificate(pool.id)).error).not.toBeNull()
    })
  })

  describe('assign and reassign', () => {
    it('lets a manager assign a tutor to an unassigned request', async () => {
      const cert = await fixture.insertCertificate({ status: 'submitted' })
      fixture.as('manager')
      const { data, error } = await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorB)

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerId: fixture.ids.tutorB, status: 'submitted' })
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.assigned'])
      expect(events[0]?.metadata).toMatchObject({ previousTutorId: null, tutorId: fixture.ids.tutorB })
      expect(events[0]?.actorId).toBe(fixture.ids.manager)
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('reassigns and moves a request that was in review back to submitted', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('owner')
      const { data, error } = await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorB)

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerId: fixture.ids.tutorB, status: 'submitted' })
      expect((await fixture.eventsFor(cert.id))[0]?.metadata).toMatchObject({ previousTutorId: fixture.ids.tutorA })
    })

    it('keeps the status of a request waiting for the volunteer', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'changes_requested' })
      fixture.as('platformAdmin')
      const { data } = await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorB)
      expect(data).toMatchObject({ reviewerId: fixture.ids.tutorB, status: 'changes_requested' })
    })

    it('rejects drafts and closed requests', async () => {
      fixture.as('manager')
      for (const status of ['draft', 'approved', 'rejected', 'withdrawn', 'revoked'] as const) {
        const cert = await fixture.insertCertificate({ status, user: 'otherAuthor' })
        expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorB)).error?.code).toBe('INVALID_STATE')
        expect((await fixture.reload(cert.id)).reviewerId).toBeNull()
      }
    })

    it('only accepts available tutors of the same organization other than the author', async () => {
      const cert = await fixture.insertCertificate({ status: 'submitted' })
      fixture.as('manager')

      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.foreignTutor)).error?.code).toBe(
        'INVALID_INPUT'
      )
      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.otherAuthor)).error?.code).toBe(
        'INVALID_INPUT'
      )
      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.author)).error?.code).toBe('FORBIDDEN')
      await fixture.db
        .update(fixture.schema.users)
        .set({ banned: true })
        .where(eq(fixture.schema.users.id, fixture.ids.tutorA))
      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorA)).error?.code).toBe('INVALID_INPUT')
      expect((await fixture.reload(cert.id)).reviewerId).toBeNull()
    })

    it('rejects the tutor that is already assigned', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('manager')
      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorA)).error?.code).toBe('INVALID_STATE')
    })

    it('is limited to organization managers and platform admins', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })

      for (const key of ['tutorA', 'tutorB', 'author', 'learner'] as const) {
        fixture.as(key)
        expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorC)).error?.code).toBe('FORBIDDEN')
      }
      for (const key of ['outsider', 'foreignTutor'] as const) {
        fixture.as(key)
        expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorC)).error?.code).toBe('NOT_FOUND')
      }
      fixture.as(null)
      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorC)).error?.code).toBe('UNAUTHORIZED')
      expect((await fixture.reload(cert.id)).reviewerId).toBe(fixture.ids.tutorA)
    })

    it('rejects an assignment based on a stale view of the request', async () => {
      const cert = await fixture.insertCertificate({ status: 'submitted' })
      fixture.as('manager')
      expect((await assignment.assignCertificateTutor(cert.id, fixture.ids.tutorA)).error).toBeNull()

      const { transaction } = await import('@/db/client')
      await expect(
        transaction(tx =>
          mutations.assignCertificate(tx, {
            expected: { reviewerId: null, status: 'submitted' },
            id: cert.id,
            reviewerId: fixture.ids.tutorB,
          })
        )
      ).rejects.toMatchObject({ code: 'INVALID_STATE' })
      expect((await fixture.reload(cert.id)).reviewerId).toBe(fixture.ids.tutorA)
    })
  })

  describe('unassign', () => {
    it('returns the request to the pool as submitted', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      fixture.as('manager')
      const { data, error } = await assignment.unassignCertificate(cert.id)

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerId: null, status: 'submitted' })
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.unassigned'])
      expect(events[0]?.metadata).toMatchObject({ previousTutorId: fixture.ids.tutorA })
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    it('lets the assigned tutor release the request', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('tutorA')
      expect((await assignment.unassignCertificate(cert.id)).data).toMatchObject({ reviewerId: null })
    })

    it('rejects other tutors, requests without a tutor, drafts and closed requests', async () => {
      const assigned = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('tutorB')
      expect((await assignment.unassignCertificate(assigned.id)).error?.code).toBe('FORBIDDEN')
      fixture.as('outsider')
      expect((await assignment.unassignCertificate(assigned.id)).error?.code).toBe('NOT_FOUND')

      fixture.as('manager')
      const pool = await fixture.insertCertificate({ status: 'submitted', user: 'otherAuthor' })
      expect((await assignment.unassignCertificate(pool.id)).error?.code).toBe('INVALID_STATE')
      const draft = await fixture.insertCertificate({ status: 'draft', user: 'otherAuthor' })
      expect((await assignment.unassignCertificate(draft.id)).error?.code).toBe('INVALID_STATE')
      const closed = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'approved', user: 'otherAuthor' })
      expect((await assignment.unassignCertificate(closed.id)).error?.code).toBe('INVALID_STATE')
      expect((await fixture.reload(closed.id)).reviewerId).toBe(fixture.ids.tutorA)
    })
  })

  describe('self-assign', () => {
    it('lets a tutor take an unassigned request without changing its status', async () => {
      const cert = await fixture.insertCertificate({ status: 'submitted' })
      fixture.as('tutorB')
      const { data, error } = await assignment.selfAssignCertificate(cert.id)

      expect(error).toBeNull()
      expect(data).toMatchObject({ reviewerId: fixture.ids.tutorB, status: 'submitted' })
      const events = await fixture.eventsFor(cert.id)
      expect(events.map(({ action }) => action)).toEqual(['certificate.assigned'])
      expect(events[0]).toMatchObject({ actorId: fixture.ids.tutorB })
      expect(events[0]?.metadata).toMatchObject({ previousTutorId: null, tutorId: fixture.ids.tutorB })
    })

    it('lets only one of two simultaneous tutors win', async () => {
      const cert = await fixture.insertCertificate({ status: 'submitted' })
      fixture.as('tutorA')
      const results = await Promise.all([
        assignment.selfAssignCertificate(cert.id),
        assignment.selfAssignCertificate(cert.id),
      ])
      expect(results.filter(({ error }) => error === null)).toHaveLength(1)
    })

    it('refuses authors, non-tutors, tutors of other organizations and taken requests', async () => {
      await fixture.db
        .update(fixture.schema.memberships)
        .set({ role: 'tutor' })
        .where(eq(fixture.schema.memberships.userId, fixture.ids.otherAuthor))
      const own = await fixture.insertCertificate({ status: 'submitted', user: 'otherAuthor' })
      fixture.as('otherAuthor')
      expect((await assignment.selfAssignCertificate(own.id)).error?.code).toBe('FORBIDDEN')

      const cert = await fixture.insertCertificate({ status: 'submitted' })
      for (const key of ['author', 'manager', 'learner'] as const) {
        fixture.as(key)
        expect((await assignment.selfAssignCertificate(cert.id)).error?.code).toBe('FORBIDDEN')
      }
      fixture.as('foreignTutor')
      expect((await assignment.selfAssignCertificate(cert.id)).error?.code).toBe('NOT_FOUND')

      const taken = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted', user: 'otherAuthor' })
      fixture.as('tutorB')
      expect((await assignment.selfAssignCertificate(taken.id)).error?.code).toBe('CONFLICT')
      expect((await fixture.reload(taken.id)).reviewerId).toBe(fixture.ids.tutorA)
    })

    it('refuses drafts and requests that are no longer waiting for a tutor', async () => {
      fixture.as('tutorB')
      for (const status of ['draft', 'in_review', 'changes_requested', 'approved', 'rejected'] as const) {
        const cert = await fixture.insertCertificate({ status, user: 'otherAuthor' })
        expect((await assignment.selfAssignCertificate(cert.id)).error?.code).toBe('INVALID_STATE')
      }
    })
  })
})
