import { describe, expect, it, vi } from 'vitest'

import { loadContext } from '@/actions/courses/learning.fixture'
import { loadEditorSummary } from '@/actions/dashboard/editor'
import { loadMemberSummary } from '@/actions/dashboard/member'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('@/actions/certificates/queries', () => ({
  listUserCertificates: () => Promise.resolve({ data: [], error: null }),
}))
vi.mock('@/actions/notifications/inbox', () => ({
  listNotifications: () => Promise.resolve({ data: { hasMore: false, items: [] }, error: null }),
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('dashboard readers', () => {
  it('reads editor content health and engagement without the cache', async () => {
    const summary = await loadEditorSummary('en', { cache: false })
    expect(summary.engagement).toHaveLength(6)
    expect(summary.health.total).toBeGreaterThanOrEqual(0)
    expect(Object.keys(summary.health.gaps).toSorted()).toEqual(['en', 'es', 'it'])
    expect(summary.stats.enrollments).toBeGreaterThanOrEqual(0)
  })

  it('reads a volunteer summary with the journey and checklist', async () => {
    const { organizationId, userId } = await loadContext('volunteer')
    const summary = await loadMemberSummary({ language: 'en', organizationId, role: 'volunteer', userId })
    expect(summary.eligibility).toMatchObject({ minSkills: 3 })
    expect(summary.journey).toHaveLength(4)
    expect(summary.checklist.map(({ key }) => key)).toEqual(['compass', 'start', 'skills', 'request'])
    expect(summary.courses.enrolled).toBe(summary.courses.completed + summary.courses.inProgress)
  })

  it('reads a learner summary without certificate data', async () => {
    const { organizationId, userId } = await loadContext('learner')
    const summary = await loadMemberSummary({ language: 'en', organizationId, role: 'learner', userId })
    expect(summary.eligibility).toBeNull()
    expect(summary.journey).toBeNull()
    expect(summary.checklist.map(({ key }) => key)).toEqual(['start', 'intro', 'learner'])
  })
})
