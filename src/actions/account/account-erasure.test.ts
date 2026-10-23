import { updateTag } from 'next/cache'

import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase, notifyMock } from '@/actions/certificates/test-harness'
import { CacheTag, certificatesOrgTag, certificatesTutorTag, certificatesUserTag } from '@/lib/cache'

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

type UserKey = keyof Fixture['ids']

describe.skipIf(!isLocalDatabase)('account erasure side effects', () => {
  let fixture: Fixture
  let deletion: typeof import('@/actions/account/deletion')

  const restoreUser = async (key: UserKey) =>
    await fixture.db
      .insert(fixture.schema.users)
      .values({
        birthPlace: 'Milan',
        birthday: '2000-01-01',
        email: `${key}-${fixture.ids[key]}@erasure.test`,
        firstName: key,
        id: fixture.ids[key],
        lastName: 'Tester',
        name: key,
        nationality: 'it',
      })
      .onConflictDoNothing()

  const erase = async (key: UserKey) => {
    const [user] = await fixture.db
      .select()
      .from(fixture.schema.users)
      .where(eq(fixture.schema.users.id, fixture.ids[key]))
    return await deletion.eraseAccount({
      email: user!.email,
      firstName: user!.firstName,
      id: user!.id,
      locale: user!.locale,
    })
  }

  const unassignedEvents = async (certificateId: number) =>
    (await fixture.eventsFor(certificateId)).filter(({ action }) => action === 'certificate.unassigned')

  beforeAll(async () => {
    fixture = await createFixture()
    deletion = await import('@/actions/account/deletion')
  })

  beforeEach(async () => {
    await Promise.all((['author', 'tutorA', 'tutorB'] as const).map(restoreUser))
    await fixture.reset()
    vi.mocked(updateTag).mockClear()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  describe('a tutor who deletes the account', () => {
    it('returns open reviews to the pool and records the unassign events', async () => {
      const inReview = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review', user: 'author' })
      const submitted = await fixture.insertCertificate({
        reviewer: 'tutorA',
        status: 'submitted',
        user: 'otherAuthor',
      })
      const changes = await fixture.insertCertificate({
        reviewer: 'tutorA',
        status: 'changes_requested',
        user: 'learner',
      })
      const approved = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'approved', user: 'manager' })
      const other = await fixture.insertCertificate({ reviewer: 'tutorB', status: 'in_review', user: 'owner' })

      expect((await erase('tutorA')).deleted).toBe(true)

      expect(await fixture.reload(inReview.id)).toMatchObject({ reviewerId: null, status: 'submitted' })
      expect(await fixture.reload(submitted.id)).toMatchObject({ reviewerId: null, status: 'submitted' })
      expect(await fixture.reload(changes.id)).toMatchObject({ reviewerId: null, status: 'changes_requested' })
      expect(await fixture.reload(approved.id)).toMatchObject({ reviewerId: null, status: 'approved' })
      expect(await fixture.reload(other.id)).toMatchObject({ reviewerId: fixture.ids.tutorB, status: 'in_review' })

      for (const cert of [inReview, submitted, changes]) {
        const events = await unassignedEvents(cert.id)
        expect(events).toHaveLength(1)
        expect(events[0]?.metadata).toMatchObject({ certificateId: cert.id, previousTutorId: fixture.ids.tutorA })
      }
      expect(await unassignedEvents(approved.id)).toHaveLength(0)
      expect(await unassignedEvents(other.id)).toHaveLength(0)

      const notified = notifyMock.mock.calls.map(([event]) => (event as { type: string }).type)
      expect(notified.filter(type => type === 'certificate.unassigned')).toHaveLength(3)
      expect(notified).toContain('account.deleted')
    })

    it('expires the certificate caches of the released requests', async () => {
      const inReview = await fixture.insertCertificate({ reviewer: 'tutorA', status: 'in_review', user: 'author' })

      expect((await erase('tutorA')).deleted).toBe(true)

      const tags = vi.mocked(updateTag).mock.calls.map(([tag]) => tag)
      expect(tags).toContain(certificatesOrgTag(fixture.organizationId))
      expect(tags).toContain(certificatesUserTag(fixture.ids.author))
      expect(await fixture.reload(inReview.id)).toMatchObject({ status: 'submitted' })
    })
  })

  describe('a volunteer who deletes the account', () => {
    it('expires the caches of the organization, the reviewer, the team and the overview', async () => {
      await fixture.insertCertificate({ status: 'draft', user: 'author' })
      await fixture.insertCertificate({ reviewer: 'tutorB', status: 'submitted', user: 'author' })

      expect((await erase('author')).deleted).toBe(true)

      const tags = vi.mocked(updateTag).mock.calls.map(([tag]) => tag)
      expect(tags).toContain(certificatesOrgTag(fixture.organizationId))
      expect(tags).toContain(certificatesTutorTag(fixture.ids.tutorB))
      expect(tags).toContain(CacheTag.Organizations)
      expect(tags).toContain(CacheTag.TeamMembers)
      expect(tags).toContain(CacheTag.AdminOverview)
      expect(
        await fixture.db
          .select({ id: fixture.schema.certificates.id })
          .from(fixture.schema.certificates)
          .where(
            and(
              eq(fixture.schema.certificates.organizationId, fixture.organizationId),
              eq(fixture.schema.certificates.status, 'submitted')
            )
          )
      ).toEqual([])
    })
  })
})
