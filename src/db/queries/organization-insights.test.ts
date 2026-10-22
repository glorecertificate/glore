import { describe, expect, it } from 'vitest'

import {
  RATING_MIN_COUNT,
  activityMessageKey,
  activityUserIds,
  buildChecklist,
  lastMonths,
  summarizeRatings,
  toActivityItems,
  toMonthlySeries,
  toPipeline,
  toTutorWorkload,
} from './organization-insights'

describe('buildChecklist', () => {
  const base = {
    certificateCount: 0,
    invitedRoles: [],
    legalName: null,
    legalRepresentative: null,
    memberRoles: ['admin' as const],
    registryId: null,
  }

  it('starts with nothing done', () => {
    expect(buildChecklist(base)).toMatchObject({ certificate: false, completed: 0, profile: false, total: 4 })
  })

  it('needs legal name, registry ID, and representative for the profile step', () => {
    expect(buildChecklist({ ...base, legalName: 'A', registryId: 'B' }).profile).toBe(false)
    expect(buildChecklist({ ...base, legalName: 'A', legalRepresentative: 'C', registryId: ' ' }).profile).toBe(false)
    expect(buildChecklist({ ...base, legalName: 'A', legalRepresentative: 'C', registryId: 'B' }).profile).toBe(true)
  })

  it('counts members and pending invitations for the tutor and volunteer steps', () => {
    expect(buildChecklist({ ...base, invitedRoles: ['tutor'], memberRoles: ['admin', 'volunteer'] })).toMatchObject({
      completed: 2,
      tutor: true,
      volunteers: true,
    })
  })

  it('marks the certificate step once a request exists', () => {
    expect(buildChecklist({ ...base, certificateCount: 1 }).certificate).toBe(true)
  })
})

describe('pipeline and months', () => {
  it('fills missing statuses with zero and ignores drafts', () => {
    expect(
      toPipeline([
        { status: 'approved', total: 3 },
        { status: 'draft', total: 9 },
      ])
    ).toEqual({
      approved: 3,
      changes_requested: 0,
      in_review: 0,
      rejected: 0,
      revoked: 0,
      submitted: 0,
      withdrawn: 0,
    })
  })

  it('lists twelve months ending with the current one across a year boundary', () => {
    const months = lastMonths(new Date(Date.UTC(2026, 1, 15)))
    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2025-03')
    expect(months.at(-1)).toBe('2026-02')
  })

  it('merges monthly counts and zero fills', () => {
    expect(
      toMonthlySeries(['2026-01', '2026-02'], [{ month: '2026-02', total: 4 }], [{ month: '2026-01', total: 2 }])
    ).toEqual([
      { approved: 2, month: '2026-01', submitted: 0 },
      { approved: 0, month: '2026-02', submitted: 4 },
    ])
  })
})

describe('summarizeRatings', () => {
  const aggregate = { certificationSupport: 4, experience: 4.5, recommendTotal: 4, recommended: 3, support: 5 }

  it('hides the aggregate below the minimum number of ratings', () => {
    expect(summarizeRatings({ ...aggregate, count: RATING_MIN_COUNT - 1 })).toEqual({
      count: RATING_MIN_COUNT - 1,
      ready: false,
    })
  })

  it('returns averages and the recommend rate at the minimum', () => {
    expect(summarizeRatings({ ...aggregate, count: RATING_MIN_COUNT })).toMatchObject({
      experience: 4.5,
      ready: true,
      recommendRate: 0.75,
    })
  })

  it('has no recommend rate without answers', () => {
    expect(summarizeRatings({ ...aggregate, count: 5, recommendTotal: 0, recommended: 0 })).toMatchObject({
      recommendRate: null,
    })
  })
})

describe('toTutorWorkload', () => {
  it('splits open and reviewed work, keeps idle tutors, and sorts by open work', () => {
    const result = toTutorWorkload(
      ['a', 'b', 'c'],
      [
        { reviewerId: 'a', status: 'approved', total: 5 },
        { reviewerId: 'b', status: 'in_review', total: 2 },
        { reviewerId: 'b', status: 'submitted', total: 1 },
        { reviewerId: 'x', status: 'submitted', total: 9 },
      ]
    )
    expect(result).toEqual([
      { open: 3, reviewed: 0, tutorId: 'b' },
      { open: 0, reviewed: 5, tutorId: 'a' },
      { open: 0, reviewed: 0, tutorId: 'c' },
    ])
  })
})

describe('activity items', () => {
  const records = [
    {
      action: 'certificate.approved',
      actorId: 'tutor',
      createdAt: '2026-10-20 10:00:00',
      id: 2,
      metadata: { certificateId: 1, holderId: 'holder', tutorId: 'tutor' },
    },
    {
      action: 'member.role_changed',
      actorId: 'owner',
      createdAt: '2026-10-19 10:00:00',
      id: 1,
      metadata: { previousRole: 'volunteer', role: 'tutor', userId: 'holder' },
    },
    {
      action: 'join_request.created',
      actorId: null,
      createdAt: '2026-10-18 10:00:00',
      id: 0,
      metadata: { joinRequestId: 4, name: 'Guest Person' },
    },
  ]

  it('collects each referenced user once', () => {
    expect(activityUserIds(records).toSorted()).toEqual(['holder', 'owner', 'tutor'])
  })

  it('resolves names, roles, and falls back to the stored request name', () => {
    const names = new Map([
      ['holder', 'Ada Holder'],
      ['owner', 'Olga Owner'],
      ['tutor', 'Tom Tutor'],
    ])
    const [approved, changed, request] = toActivityItems(records, names)
    expect(approved).toMatchObject({ actor: 'Tom Tutor', target: 'Ada Holder', tutor: 'Tom Tutor' })
    expect(changed).toMatchObject({ previousRole: 'volunteer', role: 'tutor', target: 'Ada Holder' })
    expect(request).toMatchObject({ actor: null, target: 'Guest Person' })
  })

  it('does not name a user that no longer exists', () => {
    const [approved] = toActivityItems(records, new Map())
    expect(approved).toMatchObject({ actor: null, target: null })
  })

  it('turns an action into a message key', () => {
    expect(activityMessageKey('certificate.review_escalated')).toBe('activity_certificate_review_escalated')
  })
})
