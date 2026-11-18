import { describe, expect, it, vi } from 'vitest'

import { loadContext } from '@/actions/courses/learning.fixture'
import { loadEditorSummary } from '@/actions/dashboard/editor'
import { loadLearnerSummary, loadVolunteerSummary } from '@/actions/dashboard/member'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/actions/certificates/detail-data', () => ({ fetchCertificateActivity: () => Promise.resolve(null) }))
vi.mock('@/actions/certificates/lists', () => ({
  fetchUserCertificates: () => Promise.resolve({ data: [], error: null }),
}))
vi.mock('@/actions/notifications/preview', () => ({
  readNotificationPreview: () => Promise.resolve({ hasMore: false, items: [] }),
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

  it('reads a volunteer summary with the journey and earned skills', async () => {
    const { organizationId, userId } = await loadContext('volunteer')
    const holder = { birthPlace: null, birthday: null, firstName: 'Vera', lastName: null, nationality: null }
    const summary = await loadVolunteerSummary({ holder, language: 'en', organizationId, userId })
    expect(summary.eligibility).toMatchObject({ minSkills: 3 })
    expect(summary.journey.stages.map(({ key }) => key)).toEqual(['learn', 'request', 'review', 'certificate'])
    expect(summary.skills.length).toBeLessThanOrEqual(summary.eligibility.completedSkillCount)
    expect(summary.courses.enrolled).toBe(summary.courses.completed + summary.courses.inProgress)
  })

  it('reads a learner summary with its checklist', async () => {
    const { userId } = await loadContext('learner')
    const summary = await loadLearnerSummary({ language: 'en', userId })
    expect(summary.checklist.map(({ key }) => key)).toEqual(['start', 'intro', 'learner'])
  })
})
