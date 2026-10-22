import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase, session } from '@/actions/certificates/test-harness'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', async () => (await import('@/actions/certificates/test-harness')).mocks.auth)
vi.mock('@/actions/user', async () => (await import('@/actions/certificates/test-harness')).mocks.user)
vi.mock('@/actions/courses/queries', async () => (await import('@/actions/certificates/test-harness')).mocks.courses)

describe.skipIf(!isLocalDatabase)('certificate queries', () => {
  let fixture: Fixture
  let queries: typeof import('@/actions/certificates/queries')

  beforeAll(async () => {
    fixture = await createFixture()
    queries = await import('@/actions/certificates/queries')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  describe('findCertificate', () => {
    it('shows the organization rating to the author only', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })

      fixture.as('author')
      expect((await queries.findCertificate(cert.id)).data?.rating?.experience).toBe(4)

      fixture.as('tutorA')
      const asTutor = await queries.findCertificate(cert.id)
      expect(asTutor.data).not.toBeNull()
      expect(asTutor.data?.rating).toBeNull()

      fixture.as('manager')
      expect((await queries.findCertificate(cert.id)).data?.rating).toBeNull()
    })

    it('keeps drafts private and hides certificates from other organizations', async () => {
      const draft = await fixture.insertCertificate({ status: 'draft' })
      const open = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted', user: 'otherAuthor' })

      fixture.as('manager')
      expect((await queries.findCertificate(draft.id)).data).toBeNull()
      expect((await queries.findCertificate(open.id)).data).not.toBeNull()

      fixture.as('foreignTutor')
      expect((await queries.findCertificate(open.id)).data).toBeNull()
    })
  })

  describe('findCertificateActivity', () => {
    it('returns the timeline and the latest changes request without scores', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'changes_requested' })
      const { db, schema } = fixture
      await db.insert(schema.activityEvents).values([
        {
          action: 'certificate.submitted',
          actorId: fixture.ids.author,
          metadata: { tutorId: fixture.ids.tutorA },
          organizationId: fixture.organizationId,
          subjectId: String(cert.id),
          subjectType: 'certificate',
        },
        {
          action: 'certificate.changes_requested',
          actorId: fixture.ids.tutorA,
          metadata: { comment: 'Add hours', tutorId: fixture.ids.tutorA },
          organizationId: fixture.organizationId,
          subjectId: String(cert.id),
          subjectType: 'certificate',
        },
      ])
      await db.insert(schema.certificateReviews).values({
        certificateId: cert.id,
        comment: 'Add hours',
        decision: 'changes_requested',
        reviewerId: fixture.ids.tutorA,
        scoreEngagement: 5,
        sectionComments: { experience: 'Which month?' },
      })

      fixture.as('author')
      const { data } = await queries.findCertificateActivity(cert.id)
      expect(data?.events.map(({ action }) => action)).toEqual([
        'certificate.submitted',
        'certificate.changes_requested',
      ])
      expect(data?.events[1]).toMatchObject({
        actor: { firstName: 'tutorA' },
        comment: 'Add hours',
        tutor: { firstName: 'tutorA' },
      })
      expect(data?.review).toMatchObject({
        decision: 'changes_requested',
        sectionComments: { experience: 'Which month?' },
      })
      expect(JSON.stringify(data)).not.toContain('score')
    })

    it('is not available to users who cannot see the certificate', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('foreignTutor')
      expect((await queries.findCertificateActivity(cert.id)).data).toBeNull()
    })
  })

  describe('findPublicCertificate', () => {
    it('serves a profile only when the holder opted in', async () => {
      const { db, schema } = fixture
      const cert = await fixture.insertCertificate({ code: 'LANE-A-PUBL-0001', status: 'approved' })
      await db.update(schema.certificates).set({ isDefault: true }).where(eq(schema.certificates.id, cert.id))
      const username = `lane-a-${cert.handle}`

      try {
        await db
          .update(schema.users)
          .set({ publicProfile: false, username })
          .where(eq(schema.users.id, fixture.ids.author))
        expect((await queries.findPublicCertificate(username)).data).toBeNull()

        await db.update(schema.users).set({ publicProfile: true }).where(eq(schema.users.id, fixture.ids.author))
        const { data } = await queries.findPublicCertificate(username)
        expect(data?.id).toBe(cert.id)
        expect(data?.reviewerComment).toBeNull()
      } finally {
        await db
          .update(schema.users)
          .set({ publicProfile: false, username: null })
          .where(eq(schema.users.id, fixture.ids.author))
      }
    })
  })

  describe('listOrganizationCertificates', () => {
    it('lists every non-draft certificate of the organization for its managers', async () => {
      const submitted = await fixture.insertCertificate({ status: 'submitted' })
      const approved = await fixture.insertCertificate({
        code: 'LANE-A-ORGL-0001',
        reviewer: 'tutorA',
        status: 'approved',
      })
      const draft = await fixture.insertCertificate({ status: 'draft' })
      const foreign = await fixture.insertCertificate({
        organization: fixture.otherOrganizationId,
        status: 'submitted',
        user: 'otherAuthor',
      })

      for (const key of ['manager', 'owner', 'platformAdmin'] as const) {
        fixture.as(key)
        const { data } = await queries.listOrganizationCertificates(fixture.organizationId, { cache: false })
        const ids = (data ?? []).map(({ id }) => id)
        expect(ids).toContain(submitted.id)
        expect(ids).toContain(approved.id)
        expect(ids).not.toContain(draft.id)
        expect(ids).not.toContain(foreign.id)
        expect((data ?? []).find(({ id }) => id === approved.id)?.reviewer?.firstName).toBe('tutorA')
      }
    })

    it('returns nothing to tutors, volunteers, and members of other organizations', async () => {
      await fixture.insertCertificate({ status: 'submitted' })

      for (const key of ['tutorA', 'author', 'learner', 'foreignTutor'] as const) {
        fixture.as(key)
        expect((await queries.listOrganizationCertificates(fixture.organizationId, { cache: false })).data).toEqual([])
      }
    })
  })

  describe('findReviewContext', () => {
    it('returns the holder profile and the course results for the reviewer', async () => {
      const { db, schema } = fixture
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review' })
      const [courseId] = fixture.courseIds as [number]
      const [lesson] = await db
        .insert(schema.lessons)
        .values({ courseId, sortOrder: 0, title: { en: 'Lesson', es: 'Leccion', it: 'Lezione' } })
        .returning({ id: schema.lessons.id })
      const [assessment] = await db
        .insert(schema.assessments)
        .values({ lessonId: lesson!.id })
        .returning({ id: schema.assessments.id })
      await db
        .insert(schema.userAssessments)
        .values([{ assessmentId: assessment!.id, reflection: null, userId: fixture.ids.author, value: 3 }])

      try {
        fixture.as('tutorA')
        const { data } = await queries.findReviewContext(cert.id)
        expect(data?.holder.email).toBeTruthy()
        expect(
          Object.keys(data?.results ?? {})
            .map(Number)
            .toSorted()
        ).toEqual(fixture.courseIds.slice(0, 3).toSorted())
        expect(data?.results[courseId]?.rating).toBe(3)
        expect(data?.results[courseId]?.reflection).toBeNull()
        expect(data?.results[courseId]?.completedAt).toBeNull()
      } finally {
        await db.delete(schema.userAssessments).where(eq(schema.userAssessments.assessmentId, assessment!.id))
        await db.delete(schema.assessments).where(eq(schema.assessments.id, assessment!.id))
        await db.delete(schema.lessons).where(eq(schema.lessons.id, lesson!.id))
      }
    })

    it('is not available to users who cannot see the certificate', async () => {
      const cert = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'submitted' })
      fixture.as('foreignTutor')
      expect((await queries.findReviewContext(cert.id)).data).toBeNull()
    })
  })

  describe('listSkillReflections', () => {
    it('returns the latest reflection per skill course for the signed-in user', async () => {
      const { db, schema } = fixture
      const [courseId] = fixture.courseIds as [number]
      const [lesson] = await db
        .insert(schema.lessons)
        .values({ courseId, sortOrder: 0, title: { en: 'Lesson', es: 'Leccion', it: 'Lezione' } })
        .returning({ id: schema.lessons.id })
      const [assessment] = await db
        .insert(schema.assessments)
        .values({ lessonId: lesson!.id })
        .returning({ id: schema.assessments.id })
      await db.insert(schema.userAssessments).values({
        assessmentId: assessment!.id,
        reflection: 'I coordinated the desk',
        userId: fixture.ids.author,
        value: 4,
      })

      try {
        fixture.as('author')
        expect(await queries.listSkillReflections()).toEqual({ [courseId]: 'I coordinated the desk' })

        fixture.as('otherAuthor')
        expect(await queries.listSkillReflections()).toEqual({})

        session.authUser = null
        expect(await queries.listSkillReflections()).toEqual({})
      } finally {
        await db.delete(schema.userAssessments).where(eq(schema.userAssessments.assessmentId, assessment!.id))
        await db.delete(schema.assessments).where(eq(schema.assessments.id, assessment!.id))
        await db.delete(schema.lessons).where(eq(schema.lessons.id, lesson!.id))
      }
    })
  })
})
