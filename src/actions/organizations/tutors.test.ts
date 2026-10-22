import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase } from '@/actions/certificates/test-harness'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', async () => (await import('@/actions/certificates/test-harness')).mocks.auth)
vi.mock('@/actions/user', async () => (await import('@/actions/certificates/test-harness')).mocks.user)

describe.skipIf(!isLocalDatabase)('organization tutors', () => {
  let fixture: Fixture
  let queries: typeof import('@/actions/organizations/queries')

  beforeAll(async () => {
    fixture = await createFixture()
    queries = await import('@/actions/organizations/queries')
  })

  beforeEach(async () => {
    await fixture.reset()
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  const tutorIds = async (organizationId: number) => {
    const { data } = await queries.listOrgTutors(organizationId)
    return data?.map(({ id }) => id).sort()
  }

  it.each(['platformAdmin', 'manager', 'owner'] as const)('lists the organization tutors for %s', async key => {
    fixture.as(key)
    const expected = [fixture.ids.tutorA, fixture.ids.tutorB, fixture.ids.tutorC].sort()
    expect(await tutorIds(fixture.organizationId)).toEqual(expected)
  })

  it('lets a platform admin list the tutors of an organization they do not belong to', async () => {
    fixture.as('platformAdmin')
    expect(await tutorIds(fixture.otherOrganizationId)).toEqual([fixture.ids.foreignTutor])
  })

  it.each(['tutorA', 'author', 'learner', 'foreignTutor', 'outsider'] as const)(
    'refuses the tutor list to %s',
    async key => {
      fixture.as(key)
      const { data, error } = await queries.listOrgTutors(fixture.organizationId)
      expect(data).toBeNull()
      expect(error).toBeNull()
    }
  )
})
