import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { meetsActivityRule, normalizeCertificateCode } from '@/components/features/certificates/rules'
import { type AppEvent, eventMetadata, eventSubject } from '@/db/queries/activity-event'
import { REFLECTION_MAX_LENGTH, REFLECTION_MIN_LENGTH } from '@/db/queries/learning'

import {
  DAY_MS,
  DEMO_ORGANIZATIONS,
  DEMO_USERS,
  ago,
  demoEmail,
  demoUsername,
  guardDemoTarget,
  parseDemoArgs,
} from './seed-demo-data'
import {
  DEMO_INVITATIONS,
  DEMO_INVITE_LINK,
  DEMO_JOIN_REQUESTS,
  EDITOR_COURSES,
  INVITATION_EXPIRY_DAYS,
  NOTIFICATION_WINDOW_DAYS,
  SKILL_COMPASS,
  UNREAD_WINDOW_DAYS,
  demoCode,
  demoHandle,
  planCertificates,
  planDemo,
  planEvents,
  planNotifications,
  planProgress,
  recipientsOf,
  resolveEventData,
  rolesIn,
  eventMetadata as seedMetadata,
  eventSubject as seedSubject,
} from './seed-demo-story'

const LOCAL_URL = 'postgresql://glore:pw@localhost:5433/glore'
const REMOTE_URL = 'postgresql://user:pw@ep-example.eu-central-1.aws.neon.tech/neondb'

describe('demoEmail', () => {
  it('derives a plus-address from TEST_EMAIL', () => {
    expect(demoEmail('name@example.org', 'volunteer')).toBe('name+glore-volunteer@example.org')
  })

  it('replaces an existing plus tag', () => {
    expect(demoEmail('name+inbox@example.org', 'owner-b')).toBe('name+glore-owner-b@example.org')
  })

  it('rejects a value that is not an email', () => {
    expect(() => demoEmail('example.org', 'admin')).toThrow()
  })
})

describe('demoUsername', () => {
  it('produces a valid username for hyphenated keys', () => {
    expect(demoUsername('volunteer-progress')).toBe('demo.volunteer.progress')
  })
})

describe('parseDemoArgs', () => {
  it('accepts local and staging', () => {
    expect(parseDemoArgs(['--target', 'local'])).toEqual({ target: 'local' })
    expect(parseDemoArgs(['--target', 'staging'])).toEqual({ target: 'staging' })
  })

  it('rejects production and a missing target', () => {
    expect(parseDemoArgs(['--target', 'production']).error).toBeDefined()
    expect(parseDemoArgs([]).error).toBeDefined()
  })
})

describe('guardDemoTarget', () => {
  it('needs TEST_EMAIL and DATABASE_URL', () => {
    expect(guardDemoTarget('local', undefined, 'name@example.org')).not.toBeNull()
    expect(guardDemoTarget('local', LOCAL_URL, undefined)).not.toBeNull()
  })

  it('matches the target to the database host', () => {
    expect(guardDemoTarget('local', LOCAL_URL, 'name@example.org')).toBeNull()
    expect(guardDemoTarget('local', REMOTE_URL, 'name@example.org')).not.toBeNull()
    expect(guardDemoTarget('staging', REMOTE_URL, 'name@example.org')).toBeNull()
    expect(guardDemoTarget('staging', LOCAL_URL, 'name@example.org')).not.toBeNull()
  })
})

describe('demo accounts', () => {
  it('use unique keys and known organizations', () => {
    const keys = DEMO_USERS.map(({ key }) => key)
    const organizations = new Set(DEMO_ORGANIZATIONS.map(({ key }) => key))
    expect(new Set(keys).size).toBe(keys.length)
    expect(DEMO_USERS.flatMap(({ memberships }) => Object.keys(memberships)).every(key => organizations.has(key))).toBe(
      true
    )
  })
})

const NOW = new Date('2026-10-22T12:00:00.000Z')

const plan = planDemo(NOW)

const catalogType = (slug: string) => {
  const file = `content/courses/${slug}/course.json`
  if (!existsSync(file)) return null
  return (JSON.parse(readFileSync(file, 'utf8')) as { type: string }).type
}

const messages = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<string, Record<string, unknown>>

const roleOf = (user: string, organization: string) =>
  DEMO_USERS.find(({ key }) => key === user)?.memberships[organization]

const context = {
  certificate: (key: string) => plan.certificates.findIndex(item => item.key === key) + 1,
  course: (slug: string) => slug.length,
  invitation: (key: string) => DEMO_INVITATIONS.findIndex(item => item.key === key) + 1,
  inviteLink: () => 1,
  joinRequest: (key: string) => DEMO_JOIN_REQUESTS.findIndex(item => item.key === key) + 1,
  user: (key: string) => `id-${key}`,
}

describe('demo story', () => {
  it('is deterministic for a given clock', () => {
    expect(planDemo(NOW)).toEqual(plan)
  })

  it('shifts every timestamp with the clock', () => {
    const later = planCertificates(new Date(NOW.getTime() + DAY_MS))
    const first = plan.certificates.find(item => item.submittedAt)
    const moved = later.find(item => item.key === first?.key)
    expect(Date.parse(moved?.submittedAt ?? '') - Date.parse(first?.submittedAt ?? '')).toBe(DAY_MS)
  })

  it('formats relative dates in ISO', () => {
    expect(ago(NOW, 1)).toBe('2026-10-21T12:00:00.000Z')
  })
})

describe('demo organizations', () => {
  it('has two approved organizations in Italy and Spain and one pending applicant', () => {
    const live = DEMO_ORGANIZATIONS.filter(item => item.approved)
    expect(live.map(({ country }) => country).toSorted()).toEqual(['ES', 'IT'])
    expect(DEMO_ORGANIZATIONS.filter(item => !item.approved)).toHaveLength(1)
  })

  it('gives each approved organization one owner and a complete legal profile', () => {
    for (const organization of DEMO_ORGANIZATIONS.filter(item => item.approved)) {
      expect(rolesIn(organization.key, ['admin'])).toHaveLength(1)
      expect(organization.legalName && organization.registryId && organization.legalRepresentative).toBeTruthy()
    }
  })
})

describe('demo accounts', () => {
  it('cover every key named in the manual testing flows', () => {
    const keys = DEMO_USERS.map(({ key }) => key)
    for (const key of [
      'admin',
      'editor',
      'owner',
      'rep',
      'tutor',
      'tutor2',
      'volunteer',
      'volunteer-progress',
      'volunteer-review',
      'volunteer-changes',
      'learner',
      'multi',
      'owner-b',
    ]) {
      expect(keys).toContain(key)
    }
  })

  it('puts multi in both organizations with Ponte first', () => {
    const multi = DEMO_USERS.find(({ key }) => key === 'multi')
    expect(Object.entries(multi?.memberships ?? {})).toEqual([
      ['ponte', 'volunteer'],
      ['red', 'tutor'],
    ])
  })

  it('mixes the three locales', () => {
    expect(new Set(DEMO_USERS.map(({ locale }) => locale))).toEqual(new Set(['en', 'es', 'it']))
  })

  it('keeps one public profile and one volunteer with missing personal data', () => {
    expect(DEMO_USERS.filter(({ publicProfile }) => publicProfile).map(({ key }) => key)).toEqual(['volunteer'])
    const progress = DEMO_USERS.find(({ key }) => key === 'volunteer-progress')
    expect(progress?.profile.birthPlace).toBeNull()
    expect(progress?.profile.nationality).toBeNull()
  })

  it('give every user a username that the app accepts', () => {
    for (const { key } of DEMO_USERS) expect(demoUsername(key)).toMatch(/^[a-z0-9.]+$/u)
  })
})

describe('demo certificates', () => {
  const certificates = plan.certificates

  it('cover every status and a deleted holder', () => {
    const statuses = new Set(certificates.map(({ status }) => status))
    for (const status of [
      'draft',
      'submitted',
      'in_review',
      'changes_requested',
      'approved',
      'rejected',
      'withdrawn',
      'revoked',
    ]) {
      expect(statuses).toContain(status)
    }
    const deleted = certificates.filter(({ holderDeletedAt }) => holderDeletedAt)
    expect(deleted).toHaveLength(1)
    expect(deleted[0]).toMatchObject({ holder: null, status: 'approved' })
    expect(deleted[0]?.activity.tasks.length).toBeGreaterThan(0)
    expect(deleted[0]?.activity.description).not.toBe('')
    expect(deleted[0]?.skills.every(({ evidence, statement }) => evidence && statement)).toBe(true)
  })

  it('have unique handles and valid unique codes', () => {
    const handles = certificates.map(({ handle }) => handle)
    const codes = certificates.flatMap(({ code }) => (code ? [code] : []))
    expect(new Set(handles).size).toBe(handles.length)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(normalizeCertificateCode(code)).toBe(code)
    expect(certificates.filter(({ code }) => !code).every(({ status }) => status === 'draft')).toBe(true)
  })

  it('derives codes from handles', () => {
    expect(demoCode(demoHandle('volunteer-approved'))).toBe(demoCode('demo-volunteer-approved'))
    expect(demoCode('demo-a')).not.toBe(demoCode('demo-b'))
  })

  it('belong to volunteers of their organization, reviewed by another tutor of it', () => {
    for (const { holder, organization, reviewer, status } of certificates) {
      if (holder) expect(roleOf(holder, organization)).toBe('volunteer')
      if (reviewer) {
        expect(roleOf(reviewer, organization)).toBe('tutor')
        expect(reviewer).not.toBe(holder)
      }
      if (!reviewer) expect(['draft', 'submitted']).toContain(status)
    }
  })

  it('keep at most one open request per holder and organization', () => {
    const open = certificates.filter(({ status }) => ['submitted', 'in_review', 'changes_requested'].includes(status))
    const keys = open.map(({ holder, organization }) => `${holder}:${organization}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('give submitted certificates three or four skills from the catalog and valid levels', () => {
    for (const certificate of certificates) {
      const courses = certificate.skills.map(({ course }) => course)
      expect(new Set(courses).size).toBe(courses.length)
      for (const course of courses) expect(catalogType(course)).toBe('skill')
      if (certificate.status !== 'draft') expect(courses.length).toBeGreaterThanOrEqual(3)
      expect(courses.length).toBeLessThanOrEqual(4)
      for (const { level, selfLevel } of certificate.skills) {
        expect(selfLevel).toBeGreaterThanOrEqual(1)
        expect(selfLevel).toBeLessThanOrEqual(5)
        if (level !== null) expect(level).toBeGreaterThanOrEqual(2)
      }
      const issued = ['approved', 'revoked'].includes(certificate.status)
      expect(certificate.skills.every(({ level }) => (level !== null) === issued)).toBe(true)
    }
  })

  it('meet the activity rule once submitted and finish before they are submitted', () => {
    for (const certificate of certificates.filter(({ status }) => status !== 'draft')) {
      const { duration, endDate, startDate } = certificate.activity
      expect(
        meetsActivityRule({ activityDuration: duration, activityEndDate: endDate, activityStartDate: startDate })
      ).toBe(true)
      expect(certificate.activity.endDate <= (certificate.submittedAt ?? '').slice(0, 10)).toBe(true)
    }
  })

  it('order their dates and keep them in the past', () => {
    for (const certificate of certificates) {
      const dates = [certificate.createdAt, certificate.submittedAt, certificate.reviewedAt].flatMap(value =>
        value ? [Date.parse(value)] : []
      )
      expect(dates.toSorted((a, b) => a - b)).toEqual(dates)
      expect(Math.max(...dates, Date.parse(certificate.revokedAt ?? certificate.createdAt))).toBeLessThan(NOW.getTime())
    }
  })

  it('store status specific fields', () => {
    for (const certificate of certificates) {
      expect(Boolean(certificate.rejectedReason)).toBe(certificate.status === 'rejected')
      expect(Boolean(certificate.withdrawnAt)).toBe(certificate.status === 'withdrawn')
      expect(Boolean(certificate.revokedAt && certificate.revokedBy)).toBe(certificate.status === 'revoked')
      expect(Boolean(certificate.reviewerComment)).toBe(certificate.status === 'changes_requested')
      expect(Boolean(certificate.issuedAt)).toBe(['approved', 'revoked'].includes(certificate.status))
    }
  })

  it('mark one featured approved certificate per holder at most', () => {
    const featured = certificates.filter(({ isDefault }) => isDefault)
    expect(featured.every(({ status }) => status === 'approved')).toBe(true)
    const holders = featured.map(({ holder }) => holder)
    expect(new Set(holders).size).toBe(holders.length)
  })

  it('record reviews that match the status', () => {
    for (const certificate of certificates) {
      const decisions = certificate.reviews.map(({ decision }) => decision)
      if (certificate.status === 'approved') expect(decisions).toContain('approved')
      if (certificate.status === 'rejected') expect(decisions).toEqual(['rejected'])
      if (certificate.status === 'changes_requested') {
        expect(decisions).toEqual(['changes_requested'])
        expect(Object.keys(certificate.reviews[0]?.sections ?? {}).length).toBeGreaterThan(0)
      }
      for (const review of certificate.reviews.filter(({ decision }) => decision === 'approved')) {
        expect(review.scores?.every(score => score >= 1 && score <= 5)).toBe(true)
      }
    }
  })

  it('rate organizations within range and enough times for the aggregate', () => {
    for (const { rating } of certificates) {
      if (!rating) continue
      for (const value of [rating.experience, rating.support, rating.certification]) {
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(5)
      }
      expect((rating.comment ?? '').length).toBeLessThanOrEqual(400)
    }
    for (const organization of ['ponte', 'red']) {
      expect(
        certificates.filter(item => item.organization === organization && item.rating).length
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it('set up the tutor queue described in the manual testing flows', () => {
    const owned = (status: string, tutor = 'tutor') =>
      certificates.filter(item => item.reviewer === tutor && item.status === status)
    expect(owned('submitted')).toHaveLength(1)
    expect(owned('in_review')).toHaveLength(1)
    expect(owned('changes_requested')).toHaveLength(1)
    expect(owned('approved').length + owned('rejected').length).toBe(2)
    expect(owned('submitted', 'tutor2')).toHaveLength(1)
    const old = certificates.filter(
      item =>
        ['submitted', 'in_review'].includes(item.status) &&
        NOW.getTime() - Date.parse(item.submittedAt ?? '') > 7 * DAY_MS
    )
    expect(old.map(({ reviewer }) => reviewer)).toEqual(['tutor'])
    expect(certificates.filter(item => item.status === 'submitted' && item.reviewer === null)).toHaveLength(1)
  })

  it('back the volunteer, review, changes and owner-b states', () => {
    const states = (holder: string) => certificates.filter(item => item.holder === holder).map(({ status }) => status)
    expect(states('volunteer').toSorted()).toEqual(['approved', 'draft'])
    expect(states('volunteer-review')).toEqual(['submitted'])
    expect(states('volunteer-changes')).toEqual(['changes_requested'])
    expect(states('volunteer-progress')).toEqual([])
    const red = certificates.filter(item => item.organization === 'red').map(({ status }) => status)
    expect(red).toContain('approved')
    expect(red).toContain('revoked')
  })

  it('plans one wizard draft with prefilled skills', () => {
    const draft = certificates.find(item => item.status === 'draft')
    expect(draft?.holder).toBe('volunteer')
    expect(draft?.skills).toHaveLength(3)
  })
})

describe('demo learning progress', () => {
  const progress = plan.progress

  it('uses known users and catalog courses, one row per pair', () => {
    const pairs = progress.map(({ course, user }) => `${user}:${course}`)
    expect(new Set(pairs).size).toBe(pairs.length)
    for (const { course, user } of progress) {
      expect(DEMO_USERS.some(({ key }) => key === user)).toBe(true)
      expect(catalogType(course)).not.toBeNull()
    }
  })

  it('writes reflections that pass the final assessment rules', () => {
    for (const { reflection } of progress) {
      expect(reflection.length).toBeGreaterThanOrEqual(REFLECTION_MIN_LENGTH)
      expect(reflection.length).toBeLessThanOrEqual(REFLECTION_MAX_LENGTH)
    }
  })

  it('makes volunteer eligible, volunteer-progress two of three skills and a learner without skills', () => {
    const done = (user: string) =>
      progress.filter(item => item.user === user && item.lessons === 'all' && catalogType(item.course) === 'skill')
    expect(done('volunteer').length).toBeGreaterThanOrEqual(3)
    expect(done('volunteer-progress')).toHaveLength(2)
    expect(done('learner')).toHaveLength(0)
    const partial = progress.filter(item => item.user === 'volunteer-progress' && item.lessons !== 'all')
    expect(partial).toHaveLength(1)
    expect(partial[0]).toMatchObject({ lessons: 2, partialQuiz: true })
  })

  it('keeps learners on intro and learner courses with one finished and one in progress', () => {
    const learner = progress.filter(item => item.user === 'learner')
    expect(learner.every(({ course }) => catalogType(course) !== 'skill')).toBe(true)
    expect(learner.some(item => item.lessons === 'all' && catalogType(item.course) === 'learner')).toBe(true)
    expect(learner.some(item => item.lessons !== 'all' && catalogType(item.course) === 'learner')).toBe(true)
  })

  it('gives every certificate holder the skills of their certificates', () => {
    for (const certificate of plan.certificates) {
      for (const { course } of certificate.skills) {
        if (certificate.holder) {
          expect(progress.some(item => item.user === certificate.holder && item.course === course)).toBe(true)
        }
      }
    }
  })

  it('plans the skill compass for catalog skill courses', () => {
    for (const { goals, strengths } of Object.values(SKILL_COMPASS)) {
      for (const slug of [...goals, ...strengths]) expect(catalogType(slug)).toBe('skill')
    }
  })

  it('orders progress by user for stable writes', () => {
    expect(planProgress(plan.certificates)).toEqual(progress)
  })
})

describe('demo organization flows', () => {
  it('has two pending invitations in Ponte that can be resent and expire in the future', () => {
    const pending = DEMO_INVITATIONS.filter(item => item.organization === 'ponte' && item.acceptedDaysAgo === null)
    expect(pending).toHaveLength(2)
    for (const invitation of pending) {
      expect(invitation.sentDaysAgo).toBeGreaterThan(0)
      expect(invitation.sentDaysAgo).toBeLessThan(INVITATION_EXPIRY_DAYS)
    }
  })

  it('invites only through existing managers', () => {
    for (const { invitedBy, organization } of DEMO_INVITATIONS) {
      expect(['admin', 'representative']).toContain(roleOf(invitedBy, organization))
    }
  })

  it('has an active approval link with a pending request and one decided request each way', () => {
    expect(DEMO_INVITE_LINK.requiresApproval).toBe(true)
    expect(DEMO_INVITE_LINK.uses).toBeLessThan(DEMO_INVITE_LINK.maxUses)
    expect(DEMO_JOIN_REQUESTS.filter(({ status }) => status === 'pending')).toHaveLength(1)
    expect(DEMO_JOIN_REQUESTS.map(({ status }) => status).toSorted()).toEqual(['accepted', 'pending', 'rejected'])
    expect(DEMO_JOIN_REQUESTS.find(({ status }) => status === 'pending')?.viaLink).toBe(true)
  })

  it('gives the editor two draft courses with missing translations', () => {
    expect(EDITOR_COURSES).toHaveLength(2)
    for (const course of EDITOR_COURSES) {
      expect(course.languages).toEqual([])
      expect(Object.values(course.title).some(value => value === '')).toBe(true)
      expect(course.lessons.length).toBeGreaterThan(0)
    }
  })
})

describe('demo events', () => {
  const events = plan.events

  it('are ordered by time and attributed to known people and organizations', () => {
    expect(events.map(({ at }) => at).toSorted()).toEqual(events.map(({ at }) => at))
    for (const { actor, organization } of events) {
      if (actor) expect(DEMO_USERS.some(({ key }) => key === actor)).toBe(true)
      if (organization) expect(DEMO_ORGANIZATIONS.some(({ key }) => key === organization)).toBe(true)
      expect(Date.parse(events[0]?.at ?? '')).toBeLessThan(NOW.getTime())
    }
  })

  it('render real copy in the organization activity feed in every locale', () => {
    const actions = new Set(events.filter(({ organization }) => organization).map(({ type }) => type))
    for (const locale of ['en', 'es', 'it']) {
      const organization = messages(locale).Organization ?? {}
      for (const action of actions) {
        expect(organization, `${locale} ${action}`).toHaveProperty(`activity_${action.replaceAll('.', '_')}`)
      }
    }
  })

  it('match the shapes written by recordEvent', () => {
    for (const entry of events) {
      const data = resolveEventData(entry.data, context)
      const real = { actorId: null, data, organizationId: 1, type: entry.type } as unknown as AppEvent
      expect(seedSubject(entry.type, data, 1)).toEqual(eventSubject(real))
      expect(seedMetadata(data)).toEqual(eventMetadata(real))
    }
  })

  it('keep private details out of the stored metadata', () => {
    for (const entry of events) {
      const metadata = seedMetadata(resolveEventData(entry.data, context))
      for (const field of ['email', 'url', 'message', 'documentUrl', 'applicantEmail']) {
        expect(metadata).not.toHaveProperty(field)
      }
    }
  })

  it('keep the history of the deleted certificate without a holder id', () => {
    const subject = plan.certificates.find(item => item.holderDeletedAt)?.key
    const own = events.filter(entry => entry.data.certificateId === subject)
    expect(own.length).toBeGreaterThan(0)
    for (const entry of own) expect(entry.data).not.toHaveProperty('holderId')
  })

  it('cover the life of an organization', () => {
    const types = new Set(events.map(({ type }) => type))
    for (const type of [
      'organization.application_received',
      'organization.application_decided',
      'invitation.sent',
      'invitation.accepted',
      'invite_link.created',
      'join_request.created',
      'join_request.decided',
      'member.joined',
      'member.role_changed',
      'course.completed',
      'learning.eligible',
      'certificate.submitted',
      'certificate.claimed',
      'certificate.changes_requested',
      'certificate.resubmitted',
      'certificate.approved',
      'certificate.rejected',
      'certificate.withdrawn',
      'certificate.revoked',
      'certificate.unassigned',
      'certificate.review_reminder',
      'certificate.review_escalated',
      'account.suspended',
      'account.reinstated',
      'team.invited',
    ]) {
      expect(types).toContain(type)
    }
  })

  it('give every certificate with a submission a submitted event', () => {
    const submitted = new Set(
      events.filter(({ type }) => type === 'certificate.submitted').map(item => item.data.certificateId)
    )
    for (const certificate of plan.certificates.filter(item => item.status !== 'draft')) {
      expect(submitted.has(certificate.key)).toBe(true)
    }
  })

  it('plans the same events as planEvents', () => {
    expect(planEvents(NOW, plan.certificates, plan.progress)).toEqual(events)
  })
})

describe('demo notifications', () => {
  const notifications = plan.notifications

  it('only notify known people, never the actor except for learning events', () => {
    for (const { event, user } of notifications) {
      expect(DEMO_USERS.some(({ key }) => key === user)).toBe(true)
      if (event.actor === user) expect(['learning.eligible', 'course.completed']).toContain(event.type)
    }
  })

  it('have a title in every locale', () => {
    const types = new Set(notifications.map(({ event }) => event.type.replaceAll('.', '_')))
    for (const locale of ['en', 'es', 'it']) {
      const events = (messages(locale).Notifications?.events ?? {}) as Record<string, unknown>
      for (const type of types) expect(events, `${locale} ${type}`).toHaveProperty(type)
    }
  })

  it('mix read and unread rows around the unread window', () => {
    expect(notifications.some(({ read }) => read)).toBe(true)
    expect(notifications.some(({ read }) => !read)).toBe(true)
    for (const { event, read } of notifications) {
      const age = (NOW.getTime() - Date.parse(event.at)) / DAY_MS
      expect(read).toBe(age >= UNREAD_WINDOW_DAYS)
      expect(age).toBeLessThanOrEqual(NOTIFICATION_WINDOW_DAYS)
    }
  })

  it('leave unread items for the roles that the flows start from', () => {
    const unread = new Set(notifications.filter(({ read }) => !read).map(({ user }) => user))
    for (const user of ['admin', 'owner', 'tutor', 'tutor2', 'volunteer-changes']) expect(unread).toContain(user)
  })

  it('route recipients like the notification catalog', () => {
    const base = { actor: null, at: ago(NOW, 1) }
    const submitted = {
      ...base,
      type: 'certificate.submitted',
      organization: 'ponte',
      data: { holderId: 'volunteer', tutorId: null },
    }
    expect(recipientsOf(submitted).toSorted()).toEqual(['tutor', 'tutor2'])
    expect(recipientsOf({ ...submitted, data: { holderId: 'volunteer', tutorId: 'tutor2' } })).toEqual(['tutor2'])
    const approved = { ...submitted, type: 'certificate.approved' }
    expect(recipientsOf(approved).toSorted()).toEqual(['owner', 'rep', 'volunteer'])
    expect(
      recipientsOf({ ...base, type: 'organization.application_received', organization: 'ponte', data: {} })
    ).toEqual(['admin'])
    expect(recipientsOf({ ...base, type: 'invitation.sent', organization: 'ponte', data: {} })).toEqual([])
  })

  it('never notify twice for the same event', () => {
    const pairs = planNotifications(NOW, plan.events).map(
      ({ event, user }) => `${event.at}:${event.type}:${JSON.stringify(event.data)}:${user}`
    )
    expect(new Set(pairs).size).toBe(pairs.length)
  })
})
