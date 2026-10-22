import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase, session } from '@/actions/certificates/test-harness'

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/auth', async () => (await import('@/actions/certificates/test-harness')).mocks.auth)
vi.mock('@/actions/user', async () => (await import('@/actions/certificates/test-harness')).mocks.user)

describe.skipIf(!isLocalDatabase)('workspace search', () => {
  let fixture: Fixture
  let search: typeof import('@/actions/shell/search')
  let codes: Record<string, string>
  let ids: Record<string, number>

  const lookup = async (query: string) => {
    const { data } = await search.searchWorkspace(query)
    return {
      certificates: (data?.certificates ?? []).map(({ id }) => id).toSorted(),
      members: (data?.members ?? []).map(({ name }) => name),
    }
  }

  beforeAll(async () => {
    fixture = await createFixture()
    search = await import('@/actions/shell/search')
  })

  beforeEach(async () => {
    await fixture.reset()
    const prefix = fixture.ids.author.slice(7, 11).toUpperCase()
    codes = {
      assigned: `${prefix}-0001-AAAA`,
      draft: `${prefix}-0002-BBBB`,
      foreign: `${prefix}-0003-CCCC`,
      other: `${prefix}-0004-DDDD`,
      pool: `${prefix}-0005-EEEE`,
      tutorB: `${prefix}-0006-FFFF`,
    }
    const [assigned, draft, foreign, other, pool, tutorB] = await Promise.all([
      fixture.insertCertificate({ code: codes.assigned, reviewer: 'tutorA', status: 'in_review' }),
      fixture.insertCertificate({ code: codes.draft, status: 'draft' }),
      fixture.insertCertificate({
        code: codes.foreign,
        organization: fixture.otherOrganizationId,
        status: 'submitted',
        user: 'foreignTutor',
      }),
      fixture.insertCertificate({ code: codes.other, reviewer: 'tutorA', status: 'in_review', user: 'otherAuthor' }),
      fixture.insertCertificate({ code: codes.pool, status: 'submitted', user: 'otherAuthor' }),
      fixture.insertCertificate({ code: codes.tutorB, reviewer: 'tutorB', status: 'in_review', user: 'otherAuthor' }),
    ])
    ids = {
      assigned: assigned.id,
      draft: draft.id,
      foreign: foreign.id,
      other: other.id,
      pool: pool.id,
      tutorB: tutorB.id,
    }
  })

  afterAll(async () => {
    await fixture.cleanup()
  })

  describe('certificates', () => {
    it('shows a volunteer only their own certificates, drafts included', async () => {
      fixture.as('author')
      expect(await lookup(codes.assigned)).toMatchObject({ certificates: [ids.assigned] })
      expect(await lookup(codes.draft)).toMatchObject({ certificates: [ids.draft] })
      expect(await lookup(codes.other)).toMatchObject({ certificates: [] })
      expect(await lookup('otherAuthor')).toMatchObject({ certificates: [] })
      expect(await lookup(codes.pool)).toMatchObject({ certificates: [] })
    })

    it('matches codes typed without dashes and in any case', async () => {
      fixture.as('author')
      const compact = codes.assigned.replaceAll('-', '').toLowerCase()
      expect(await lookup(compact)).toMatchObject({ certificates: [ids.assigned] })
    })

    it('shows a tutor their assigned and pooled requests, never drafts or other tutors', async () => {
      fixture.as('tutorA')
      expect(await lookup(codes.other)).toMatchObject({ certificates: [ids.other] })
      expect(await lookup(codes.pool)).toMatchObject({ certificates: [ids.pool] })
      expect(await lookup('otherAuthor')).toMatchObject({ certificates: [ids.other, ids.pool].toSorted() })
      expect(await lookup(codes.tutorB)).toMatchObject({ certificates: [] })
      expect(await lookup(codes.draft)).toMatchObject({ certificates: [] })
    })

    it('shows organization managers every non-draft certificate of the active organization', async () => {
      for (const key of ['manager', 'owner'] as const) {
        fixture.as(key)
        expect(await lookup('Tester')).toMatchObject({
          certificates: [ids.assigned, ids.other, ids.pool, ids.tutorB].toSorted(),
        })
        expect(await lookup(codes.draft)).toMatchObject({ certificates: [] })
        expect(await lookup(codes.foreign)).toMatchObject({ certificates: [] })
      }
    })

    it('finds a certificate by holder name for managers', async () => {
      fixture.as('manager')
      expect(await lookup('otherAuthor')).toMatchObject({
        certificates: [ids.other, ids.pool, ids.tutorB].toSorted(),
      })
    })

    it('keeps other organizations out of reach', async () => {
      fixture.as('foreignTutor')
      session.organizationId = fixture.otherOrganizationId
      expect(await lookup(codes.assigned)).toMatchObject({ certificates: [] })
      expect(await lookup(codes.pool)).toMatchObject({ certificates: [] })
      expect(await lookup(codes.foreign)).toMatchObject({ certificates: [ids.foreign] })
    })

    it('ignores an active organization the user does not belong to', async () => {
      fixture.as('owner')
      session.organizationId = fixture.otherOrganizationId
      expect(await lookup(codes.foreign)).toMatchObject({ certificates: [] })
      expect(await lookup('foreignTutor')).toEqual({ certificates: [], members: [] })
    })

    it('returns no certificates to platform admins and users outside any organization', async () => {
      fixture.as('platformAdmin')
      expect(await lookup(codes.assigned)).toMatchObject({ certificates: [] })
      fixture.as('outsider')
      expect(await lookup(codes.assigned)).toMatchObject({ certificates: [] })
    })
  })

  describe('members', () => {
    it('lets managers search members of the active organization only', async () => {
      fixture.as('manager')
      expect(await lookup('tutorA')).toMatchObject({ members: ['tutorA Tester'] })
      expect(await lookup('foreignTutor')).toMatchObject({ members: [] })
    })

    it('matches members by email', async () => {
      fixture.as('owner')
      const { data } = await search.searchWorkspace('learner-')
      expect(data?.members.map(({ name }) => name)).toEqual(['learner Tester'])
    })

    it('hides members from tutors, volunteers, learners, and platform admins', async () => {
      for (const key of ['tutorA', 'author', 'learner', 'platformAdmin'] as const) {
        fixture.as(key)
        expect(await lookup('Tester')).toMatchObject({ members: [] })
      }
    })
  })

  describe('input and session', () => {
    it('ignores short queries and signed-out visitors', async () => {
      fixture.as('manager')
      expect(await lookup('a')).toEqual({ certificates: [], members: [] })
      fixture.as(null)
      const result = await search.searchWorkspace('Tester')
      expect(result.data).toBeNull()
    })

    it('treats like wildcards as plain text', async () => {
      fixture.as('manager')
      expect(await lookup('%%')).toEqual({ certificates: [], members: [] })
      expect(await lookup('te_ter')).toEqual({ certificates: [], members: [] })
    })
  })
})
