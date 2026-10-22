import { describe, expect, it } from 'vitest'

import {
  type EditorCourseRow,
  type MemberCourseRow,
  type QueueCertificate,
  buildContentHealth,
  buildTutorSummary,
  memberChecklist,
  memberJourney,
  pickCurrentCertificate,
  resolveView,
  summarizeEditorStats,
  summarizeMemberCourses,
  summarizeReviewTime,
  summarizeWaiting,
  toEngagementSeries,
  topCourses,
} from '@/actions/dashboard/core'
import { recommendFromCompass } from '@/db/queries/learning'

const NOW = Date.parse('2026-10-22T12:00:00Z')
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString()

const certificate = (overrides: Partial<QueueCertificate> & { id: number }): QueueCertificate => ({
  createdAt: daysAgo(10),
  reviewedAt: null,
  status: 'submitted',
  submittedAt: daysAgo(2),
  user: { firstName: 'Ada', lastName: 'Lovelace' },
  ...overrides,
})

describe('resolveView', () => {
  it('prefers the platform team over the organization role', () => {
    expect(resolveView({ canEdit: true, role: 'volunteer' })).toBe('editor')
  })

  it('maps organization roles', () => {
    expect(resolveView({ canEdit: false, role: 'admin' })).toBe('manager')
    expect(resolveView({ canEdit: false, role: 'representative' })).toBe('manager')
    expect(resolveView({ canEdit: false, role: 'tutor' })).toBe('tutor')
    expect(resolveView({ canEdit: false, role: 'volunteer' })).toBe('volunteer')
    expect(resolveView({ canEdit: false, role: 'learner' })).toBe('learner')
    expect(resolveView({ canEdit: false, role: null })).toBe('none')
  })
})

describe('waiting and review time', () => {
  it('counts only requests waiting for a decision and finds the oldest', () => {
    const summary = summarizeWaiting(
      [
        certificate({ id: 1, submittedAt: daysAgo(2) }),
        certificate({ id: 2, status: 'in_review', submittedAt: daysAgo(8) }),
        certificate({ id: 3, status: 'changes_requested', submittedAt: daysAgo(30) }),
        certificate({ id: 4, status: 'approved', submittedAt: daysAgo(40) }),
      ],
      NOW
    )
    expect(summary.count).toBe(2)
    expect(summary.oldest).toMatchObject({ days: 8, holder: 'Ada Lovelace', id: 2, tone: 'overdue' })
  })

  it('returns no oldest item for an empty queue', () => {
    expect(summarizeWaiting([], NOW)).toEqual({ count: 0, oldest: null })
  })

  it('averages decided reviews inside the window only', () => {
    const time = summarizeReviewTime(
      [
        certificate({ id: 1, reviewedAt: daysAgo(1), status: 'approved', submittedAt: daysAgo(2) }),
        certificate({ id: 2, reviewedAt: daysAgo(5), status: 'rejected', submittedAt: daysAgo(8) }),
        certificate({ id: 3, reviewedAt: daysAgo(200), status: 'approved', submittedAt: daysAgo(210) }),
        certificate({ id: 4, reviewedAt: daysAgo(1), status: 'changes_requested', submittedAt: daysAgo(3) }),
        certificate({ id: 5, reviewedAt: null, status: 'approved', submittedAt: daysAgo(3) }),
      ],
      NOW
    )
    expect(time).toEqual({ averageHours: 48, sample: 2 })
  })

  it('has no average without decided reviews', () => {
    expect(summarizeReviewTime([certificate({ id: 1 })], NOW)).toEqual({ averageHours: null, sample: 0 })
  })

  it('merges assigned and pool requests oldest first for the tutor queue', () => {
    const summary = buildTutorSummary(
      [certificate({ id: 1, submittedAt: daysAgo(3) }), certificate({ id: 2, status: 'changes_requested' })],
      [certificate({ id: 3, submittedAt: daysAgo(9) })],
      NOW
    )
    expect(summary.assigned.count).toBe(1)
    expect(summary.pool.count).toBe(1)
    expect(summary.waitingVolunteer).toBe(1)
    expect(summary.queue.map(({ id, source }) => `${source}:${id}`)).toEqual(['pool:3', 'assigned:1'])
    expect(summary.oldest).toMatchObject({ id: 3, source: 'pool' })
  })

  it('caps the queue preview', () => {
    const many = Array.from({ length: 9 }, (_, index) => certificate({ id: index + 1 }))
    expect(buildTutorSummary(many, [], NOW).queue).toHaveLength(5)
  })
})

describe('pickCurrentCertificate', () => {
  const item = (status: QueueCertificate['status'], updatedAt: string, isDefault = false) => ({
    isDefault,
    status,
    updatedAt,
  })

  it('prefers an open request, then a draft, then an approved certificate', () => {
    const open = item('in_review', '2026-01-01 10:00:00')
    const approved = item('approved', '2026-05-01 10:00:00', true)
    const draft = item('draft', '2026-03-01 10:00:00')
    expect(pickCurrentCertificate([approved, draft, open])).toBe(open)
    expect(pickCurrentCertificate([approved, draft])).toBe(draft)
    expect(pickCurrentCertificate([item('revoked', '2026-06-01 10:00:00'), approved])).toBe(approved)
  })

  it('prefers the featured certificate, then the latest update', () => {
    const older = item('approved', '2026-01-01 10:00:00')
    const newer = item('approved', '2026-02-01 10:00:00')
    const featured = item('approved', '2025-12-01 10:00:00', true)
    expect(pickCurrentCertificate([older, newer])).toBe(newer)
    expect(pickCurrentCertificate([older, newer, featured])).toBe(featured)
  })

  it('returns null without certificates', () => {
    expect(pickCurrentCertificate([])).toBeNull()
  })
})

describe('memberJourney', () => {
  const states = (steps: ReturnType<typeof memberJourney>) => steps.map(({ state }) => state)

  it('starts with learning until the volunteer is eligible', () => {
    expect(states(memberJourney({ eligible: false, status: null }))).toEqual([
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
    ])
    expect(states(memberJourney({ eligible: true, status: null }))).toEqual(['done', 'current', 'upcoming', 'upcoming'])
  })

  it('keeps the request step open for a draft or a withdrawn request', () => {
    expect(states(memberJourney({ eligible: false, status: 'draft' }))).toEqual([
      'done',
      'current',
      'upcoming',
      'upcoming',
    ])
    expect(states(memberJourney({ eligible: true, status: 'withdrawn' }))).toEqual([
      'done',
      'current',
      'upcoming',
      'upcoming',
    ])
  })

  it('follows the review and the outcome', () => {
    expect(states(memberJourney({ eligible: true, status: 'in_review' }))).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
    ])
    expect(memberJourney({ eligible: true, status: 'changes_requested' })[2]).toMatchObject({
      outcome: 'changes_requested',
      state: 'current',
    })
    expect(states(memberJourney({ eligible: true, status: 'approved' }))).toEqual(['done', 'done', 'done', 'done'])
    expect(memberJourney({ eligible: true, status: 'rejected' })[3]).toMatchObject({
      outcome: 'rejected',
      state: 'failed',
    })
    expect(memberJourney({ eligible: true, status: 'revoked' })[3]).toMatchObject({
      outcome: 'revoked',
      state: 'failed',
    })
  })
})

const row = (overrides: Partial<MemberCourseRow> & { id: number }): MemberCourseRow => ({
  completedAt: null,
  done: 0,
  enrolled: false,
  icon: null,
  languages: ['en'],
  skillGroupId: null,
  slug: `course-${overrides.id}`,
  sortOrder: overrides.id,
  title: `Course ${overrides.id}`,
  total: 3,
  type: 'skill',
  updatedAt: null,
  ...overrides,
})

describe('summarizeMemberCourses', () => {
  const rows = [
    row({ completedAt: '2026-10-01 10:00:00', done: 3, enrolled: true, id: 1, type: 'intro' }),
    row({ done: 1, enrolled: true, id: 2, updatedAt: '2026-10-10 10:00:00' }),
    row({ done: 2, enrolled: true, id: 3, updatedAt: '2026-10-20 10:00:00' }),
    row({ id: 4 }),
    row({ id: 5 }),
    row({ id: 6, languages: [] }),
    row({ id: 7, total: 0 }),
  ]

  it('splits enrolled courses and orders progress by recent activity', () => {
    const summary = summarizeMemberCourses(rows, [], recommendFromCompass)
    expect(summary).toMatchObject({ available: 5, completed: 1, enrolled: 3, inProgress: 2 })
    expect(summary.completedByType).toEqual({ intro: 1, learner: 0, skill: 0 })
    expect(summary.continuing.map(({ slug, percent }) => `${slug}:${percent}`)).toEqual(['course-3:67', 'course-2:33'])
  })

  it('recommends open courses, goals first, and skips unpublished ones', () => {
    const summary = summarizeMemberCourses(rows, [5], recommendFromCompass)
    expect(summary.recommendations.map(({ slug, goal }) => `${slug}:${goal}`)).toEqual([
      'course-5:true',
      'course-4:false',
    ])
  })

  it('handles a member with no courses', () => {
    expect(summarizeMemberCourses([], [], recommendFromCompass)).toMatchObject({
      available: 0,
      continuing: [],
      enrolled: 0,
      recommendations: [],
    })
  })
})

describe('memberChecklist', () => {
  const summary = { completedByType: { intro: 0, learner: 0, skill: 0 }, enrolled: 0 }
  const base = {
    compassSet: false,
    eligible: false,
    hasRequested: false,
    skillsCompleted: 0,
    skillsRequired: 3,
    summary,
  }

  it('lists the volunteer steps with the request link following eligibility', () => {
    const items = memberChecklist('volunteer', base)
    expect(items.map(({ done, key }) => `${key}:${done}`)).toEqual([
      'compass:false',
      'start:false',
      'skills:false',
      'request:false',
    ])
    expect(items[3]?.href).toBe('/certificates')
    expect(memberChecklist('volunteer', { ...base, eligible: true })[3]?.href).toBe('/certificates/new')
  })

  it('marks steps done from progress', () => {
    const items = memberChecklist('volunteer', {
      ...base,
      compassSet: true,
      hasRequested: true,
      skillsCompleted: 3,
      summary: { ...summary, enrolled: 4 },
    })
    expect(items.every(({ done }) => done)).toBe(true)
  })

  it('lists the learner steps', () => {
    const items = memberChecklist('learner', {
      ...base,
      summary: { completedByType: { intro: 1, learner: 0, skill: 0 }, enrolled: 2 },
    })
    expect(items.map(({ done, key }) => `${key}:${done}`)).toEqual(['start:true', 'intro:true', 'learner:false'])
  })
})

const course = (overrides: Partial<EditorCourseRow> & { id: number }): EditorCourseRow => ({
  archived: false,
  completions: 0,
  enrollments: 0,
  hasAssessment: true,
  icon: null,
  languages: ['en', 'es', 'it'],
  lessonCount: 3,
  ratingAverage: null,
  ratingCount: 0,
  skillGroupId: 1,
  slug: `course-${overrides.id}`,
  title: `Course ${overrides.id}`,
  type: 'skill',
  ...overrides,
})

describe('buildContentHealth', () => {
  it('counts publication states, translation gaps, and issues, ignoring archived courses for gaps', () => {
    const health = buildContentHealth([
      course({ id: 1 }),
      course({ id: 2, languages: ['en'] }),
      course({ id: 3, languages: [], lessonCount: 0 }),
      course({ id: 4, hasAssessment: false, skillGroupId: null }),
      course({ archived: true, id: 5, languages: [] }),
    ])
    expect(health.total).toBe(4)
    expect(health.states).toEqual({ archived: 1, draft: 1, partial: 1, published: 2 })
    expect(health.gaps).toEqual({ en: 1, es: 2, it: 2 })
    expect(health.issues).toEqual({ empty: 1, noAssessment: 1, noGroup: 1 })
  })

  it('puts the courses with the most problems first and leaves healthy ones out', () => {
    const health = buildContentHealth([
      course({ id: 1 }),
      course({ id: 2, languages: ['en'] }),
      course({ id: 3, languages: [], lessonCount: 0 }),
    ])
    expect(health.attention.map(({ slug }) => slug)).toEqual(['course-3', 'course-2'])
    expect(health.attention[1]?.missing).toEqual(['es', 'it'])
  })

  it('reports a clear catalog', () => {
    expect(buildContentHealth([course({ id: 1 })]).attention).toEqual([])
  })
})

describe('editor engagement', () => {
  it('fills missing months with zeros', () => {
    expect(
      toEngagementSeries(
        ['2026-08', '2026-09', '2026-10'],
        [{ month: '2026-09', total: 4 }],
        [{ month: '2026-10', total: 2 }]
      )
    ).toEqual([
      { completed: 0, month: '2026-08', started: 0 },
      { completed: 0, month: '2026-09', started: 4 },
      { completed: 2, month: '2026-10', started: 0 },
    ])
  })

  it('ranks live courses by enrollments', () => {
    const top = topCourses([
      course({ enrollments: 3, id: 1 }),
      course({ enrollments: 9, id: 2 }),
      course({ archived: true, enrollments: 50, id: 3 }),
      course({ enrollments: 0, id: 4 }),
    ])
    expect(top.map(({ id }) => id)).toEqual([2, 1])
  })

  it('weights the average rating by rating count and computes completion', () => {
    const stats = summarizeEditorStats([
      course({ completions: 2, enrollments: 4, id: 1, ratingAverage: 5, ratingCount: 1 }),
      course({ completions: 1, enrollments: 4, id: 2, ratingAverage: 3, ratingCount: 3 }),
      course({ archived: true, completions: 9, enrollments: 9, id: 3, ratingAverage: 1, ratingCount: 9 }),
    ])
    expect(stats).toEqual({ averageRating: 3.5, completionRate: 38, enrollments: 8, ratings: 4 })
  })

  it('has no rate or rating without data', () => {
    expect(summarizeEditorStats([])).toEqual({ averageRating: null, completionRate: null, enrollments: 0, ratings: 0 })
  })
})
