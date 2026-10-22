import { type Route } from 'next'

import { type Locale } from 'next-intl'

import { type AgeTone, ageTone, journeySteps } from '@/components/features/certificates/rules'
import { type Certificate, type CertificateStatus, OPEN_CERTIFICATE_STATUSES } from '@/db/queries/certificate'
import { type SkillOption } from '@/db/queries/learning'
import { type Notification } from '@/db/queries/notification'
import { timestampMillis } from '@/db/queries/organization'
import { type ActivityItem, type OrganizationChecklist, type Pipeline } from '@/db/queries/organization-insights'
import { type EnumType } from '@/db/types'
import { LOCALES } from '@/lib/i18n'
import { fullName } from '@/lib/utils'

type Role = EnumType<'role'>
type CourseType = EnumType<'course_type'>

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

const REVIEW_WINDOW_DAYS = 90
const QUEUE_PREVIEW_SIZE = 5
const CONTINUE_LIMIT = 3
const RECOMMENDATION_LIMIT = 3
const ATTENTION_LIMIT = 6
const TOP_COURSES_LIMIT = 8

export type DashboardView = 'editor' | 'learner' | 'manager' | 'none' | 'tutor' | 'volunteer'

export const resolveView = ({ canEdit, role }: { canEdit: boolean; role: Role | null }): DashboardView => {
  if (canEdit) return 'editor'
  if (role === 'admin' || role === 'representative') return 'manager'
  if (role === 'tutor') return 'tutor'
  if (role === 'volunteer') return 'volunteer'
  if (role === 'learner') return 'learner'
  return 'none'
}

const millis = (value: string) => timestampMillis(value)

const waitingDays = (from: string, now: number) => Math.max(0, Math.floor((now - millis(from)) / DAY_MS))

export interface QueueCertificate {
  createdAt: string
  id: number
  reviewedAt: string | null
  status: CertificateStatus
  submittedAt: string | null
  user?: { firstName: string; lastName: string | null } | null
}

interface WaitingItem {
  days: number
  holder: string | null
  id: number
  tone: AgeTone
}

const toWaiting = (certificate: QueueCertificate, now: number): WaitingItem => {
  const days = waitingDays(certificate.submittedAt ?? certificate.createdAt, now)
  return {
    days,
    holder: certificate.user ? fullName(certificate.user) || null : null,
    id: certificate.id,
    tone: ageTone(days),
  }
}

const byAge = (a: WaitingItem, b: WaitingItem) => b.days - a.days || a.id - b.id

const isWaiting = ({ status }: QueueCertificate) => status === 'submitted' || status === 'in_review'

export interface WaitingSummary {
  count: number
  oldest: WaitingItem | null
}

export const summarizeWaiting = (certificates: QueueCertificate[], now: number): WaitingSummary => {
  const items = certificates.flatMap(certificate => (isWaiting(certificate) ? [toWaiting(certificate, now)] : []))
  return { count: items.length, oldest: items.toSorted(byAge)[0] ?? null }
}

interface ReviewTime {
  averageHours: number | null
  sample: number
}

const DECIDED_STATUSES = new Set<CertificateStatus>(['approved', 'rejected', 'revoked'])

export const summarizeReviewTime = (certificates: QueueCertificate[], now: number): ReviewTime => {
  const since = now - REVIEW_WINDOW_DAYS * DAY_MS
  const durations = certificates.flatMap(({ reviewedAt, status, submittedAt }) => {
    if (!(reviewedAt && submittedAt && DECIDED_STATUSES.has(status))) return []
    const decided = millis(reviewedAt)
    const duration = decided - millis(submittedAt)
    return decided >= since && duration >= 0 ? [duration] : []
  })
  if (durations.length === 0) return { averageHours: null, sample: 0 }
  const total = durations.reduce((sum, duration) => sum + duration, 0)
  return { averageHours: Math.round((total / durations.length / HOUR_MS) * 10) / 10, sample: durations.length }
}

export interface TutorQueueItem extends WaitingItem {
  source: 'assigned' | 'pool'
}

export interface TutorSummary {
  assigned: WaitingSummary
  oldest: TutorQueueItem | null
  pool: WaitingSummary
  queue: TutorQueueItem[]
  reviewTime: ReviewTime
  waitingVolunteer: number
}

export const buildTutorSummary = (
  assigned: QueueCertificate[],
  unassigned: QueueCertificate[],
  now: number
): TutorSummary => {
  const mine = summarizeWaiting(assigned, now)
  const pool = summarizeWaiting(unassigned, now)
  const queue: TutorQueueItem[] = [
    ...assigned.flatMap(certificate =>
      isWaiting(certificate) ? [{ ...toWaiting(certificate, now), source: 'assigned' as const }] : []
    ),
    ...unassigned.flatMap(certificate =>
      isWaiting(certificate) ? [{ ...toWaiting(certificate, now), source: 'pool' as const }] : []
    ),
  ].toSorted(byAge)
  return {
    assigned: mine,
    oldest: queue[0] ?? null,
    pool,
    queue: queue.slice(0, QUEUE_PREVIEW_SIZE),
    reviewTime: summarizeReviewTime(assigned, now),
    waitingVolunteer: assigned.filter(({ status }) => status === 'changes_requested').length,
  }
}

const CERTIFICATE_PRIORITY = (certificate: Pick<Certificate, 'status'>) => {
  if ((OPEN_CERTIFICATE_STATUSES as readonly CertificateStatus[]).includes(certificate.status)) return 0
  if (certificate.status === 'draft') return 1
  if (certificate.status === 'approved') return 2
  return 3
}

export const pickCurrentCertificate = <T extends Pick<Certificate, 'isDefault' | 'status' | 'updatedAt'>>(
  certificates: T[]
) =>
  certificates.toSorted(
    (a, b) =>
      CERTIFICATE_PRIORITY(a) - CERTIFICATE_PRIORITY(b) ||
      Number(b.isDefault) - Number(a.isDefault) ||
      millis(b.updatedAt) - millis(a.updatedAt)
  )[0] ?? null

type JourneyKey = 'issued' | 'learn' | 'request' | 'review'
type JourneyState = 'current' | 'done' | 'failed' | 'upcoming'
type JourneyOutcome = 'changes_requested' | 'rejected' | 'revoked'

export interface MemberJourneyStep {
  key: JourneyKey
  outcome: JourneyOutcome | null
  state: JourneyState
}

const toOutcome = (outcome: string | null): JourneyOutcome | null =>
  outcome === 'changes_requested' || outcome === 'rejected' || outcome === 'revoked' ? outcome : null

export const memberJourney = ({
  eligible,
  status,
}: {
  eligible: boolean
  status: CertificateStatus | null
}): MemberJourneyStep[] => {
  if (!status || status === 'draft' || status === 'withdrawn') {
    const ready = eligible || status === 'draft'
    return [
      { key: 'learn', outcome: null, state: ready ? 'done' : 'current' },
      { key: 'request', outcome: null, state: ready ? 'current' : 'upcoming' },
      { key: 'review', outcome: null, state: 'upcoming' },
      { key: 'issued', outcome: null, state: 'upcoming' },
    ]
  }
  const [, , review, issued] = journeySteps(status)
  return [
    { key: 'learn', outcome: null, state: 'done' },
    { key: 'request', outcome: null, state: 'done' },
    { key: 'review', outcome: toOutcome(review?.outcome ?? null), state: review?.state ?? 'upcoming' },
    { key: 'issued', outcome: toOutcome(issued?.outcome ?? null), state: issued?.state ?? 'upcoming' },
  ]
}

export interface MemberCourseRow {
  completedAt: string | null
  done: number
  enrolled: boolean
  icon: string | null
  id: number
  languages: string[] | null
  skillGroupId: number | null
  slug: string
  sortOrder: number | null
  title: string
  total: number
  type: CourseType
  updatedAt: string | null
}

interface ContinueCourse {
  icon: string | null
  percent: number
  slug: string
  title: string
  type: CourseType
}

interface RecommendedCourse {
  goal: boolean
  icon: string | null
  slug: string
  title: string
  type: CourseType
}

export interface MemberCourseSummary {
  available: number
  completed: number
  completedByType: Record<CourseType, number>
  continuing: ContinueCourse[]
  enrolled: number
  inProgress: number
  recommendations: RecommendedCourse[]
}

const isAvailable = ({ languages, total }: MemberCourseRow) => Boolean(languages?.length) && total > 0

const emptyByType = (): Record<CourseType, number> => ({ intro: 0, learner: 0, skill: 0 })

export const summarizeMemberCourses = (
  rows: MemberCourseRow[],
  goals: number[],
  recommend: (options: SkillOption[], goals: number[], limit: number) => SkillOption[]
): MemberCourseSummary => {
  const enrolled = rows.filter(row => row.enrolled)
  const completed = enrolled.filter(row => row.completedAt)
  const progressing = enrolled
    .filter(row => !row.completedAt)
    .toSorted((a, b) => millis(b.updatedAt ?? '1970-01-01') - millis(a.updatedAt ?? '1970-01-01'))
  const completedByType = completed.reduce((counts, row) => {
    counts[row.type] += 1
    return counts
  }, emptyByType())
  const goalIds = new Set(goals)
  const options = rows.flatMap(row =>
    !row.enrolled && isAvailable(row)
      ? [
          {
            completed: false,
            icon: row.icon,
            id: row.id,
            skillGroupId: row.skillGroupId,
            slug: row.slug,
            sortOrder: row.sortOrder,
            title: row.title,
          },
        ]
      : []
  )
  const typeOf = new Map(rows.map(row => [row.id, row.type]))

  return {
    available: rows.filter(isAvailable).length,
    completed: completed.length,
    completedByType,
    continuing: progressing.slice(0, CONTINUE_LIMIT).map(row => ({
      icon: row.icon,
      percent: row.total > 0 ? Math.round((row.done / row.total) * 100) : 0,
      slug: row.slug,
      title: row.title,
      type: row.type,
    })),
    enrolled: enrolled.length,
    inProgress: progressing.length,
    recommendations: recommend(options, goals, RECOMMENDATION_LIMIT).map(option => ({
      goal: goalIds.has(option.id),
      icon: option.icon,
      slug: option.slug,
      title: option.title,
      type: typeOf.get(option.id) ?? 'intro',
    })),
  }
}

export interface ChecklistItem {
  done: boolean
  href: Route
  key: string
}

export interface MemberProgress {
  compassSet: boolean
  eligible: boolean
  hasRequested: boolean
  summary: Pick<MemberCourseSummary, 'completedByType' | 'enrolled'>
  skillsCompleted: number
  skillsRequired: number
}

export const memberChecklist = (role: 'learner' | 'volunteer', progress: MemberProgress): ChecklistItem[] => {
  const { completedByType, enrolled } = progress.summary
  if (role === 'learner') {
    return [
      { done: enrolled > 0, href: '/courses', key: 'start' },
      { done: completedByType.intro > 0, href: '/courses', key: 'intro' },
      { done: completedByType.learner > 0, href: '/courses', key: 'learner' },
    ]
  }
  return [
    { done: progress.compassSet, href: '/courses', key: 'compass' },
    { done: enrolled > 0, href: '/courses', key: 'start' },
    { done: progress.skillsCompleted >= progress.skillsRequired, href: '/courses', key: 'skills' },
    {
      done: progress.hasRequested,
      href: progress.eligible ? '/certificates/new' : '/certificates',
      key: 'request',
    },
  ]
}

export interface EditorCourseRow {
  enrollments: number
  completions: number
  hasAssessment: boolean
  icon: string | null
  id: number
  languages: string[] | null
  lessonCount: number
  ratingAverage: number | null
  ratingCount: number
  skillGroupId: number | null
  slug: string
  title: string
  type: CourseType
  archived: boolean
}

type PublicationState = 'archived' | 'draft' | 'partial' | 'published'

const publicationState = ({ archived, languages }: Pick<EditorCourseRow, 'archived' | 'languages'>) => {
  if (archived) return 'archived' satisfies PublicationState
  const count = languages?.length ?? 0
  if (count === 0) return 'draft' satisfies PublicationState
  return count < LOCALES.length ? ('partial' satisfies PublicationState) : ('published' satisfies PublicationState)
}

type ContentIssue = 'empty' | 'noAssessment' | 'noGroup'

interface AttentionCourse {
  issues: ContentIssue[]
  missing: Locale[]
  slug: string
  title: string
}

export interface ContentHealth {
  attention: AttentionCourse[]
  gaps: Record<Locale, number>
  issues: Record<ContentIssue, number>
  states: Record<PublicationState, number>
  total: number
}

const courseIssues = (course: EditorCourseRow): ContentIssue[] => {
  const issues: ContentIssue[] = []
  if (course.lessonCount === 0) issues.push('empty')
  if (course.type === 'skill' && course.lessonCount > 0 && !course.hasAssessment) issues.push('noAssessment')
  if (course.type === 'skill' && course.skillGroupId === null) issues.push('noGroup')
  return issues
}

export const buildContentHealth = (courses: EditorCourseRow[]): ContentHealth => {
  const live = courses.filter(course => !course.archived)
  const states: Record<PublicationState, number> = { archived: 0, draft: 0, partial: 0, published: 0 }
  for (const course of courses) states[publicationState(course)] += 1

  const gaps = Object.fromEntries(
    LOCALES.map(locale => [locale, live.filter(course => !course.languages?.includes(locale)).length])
  ) as Record<Locale, number>
  const issues: Record<ContentIssue, number> = { empty: 0, noAssessment: 0, noGroup: 0 }

  const attention = live
    .flatMap(course => {
      const found = courseIssues(course)
      for (const issue of found) issues[issue] += 1
      const missing = LOCALES.filter(locale => !course.languages?.includes(locale))
      return found.length > 0 || missing.length > 0
        ? [{ issues: found, missing, slug: course.slug, title: course.title }]
        : []
    })
    .toSorted((a, b) => b.issues.length - a.issues.length || b.missing.length - a.missing.length)

  return { attention: attention.slice(0, ATTENTION_LIMIT), gaps, issues, states, total: live.length }
}

export interface EngagementPoint {
  completed: number
  month: string
  started: number
}

export const toEngagementSeries = (
  months: string[],
  started: { month: string; total: number }[],
  completed: { month: string; total: number }[]
): EngagementPoint[] => {
  const startedBy = new Map(started.map(({ month, total }) => [month, total]))
  const completedBy = new Map(completed.map(({ month, total }) => [month, total]))
  return months.map(month => ({
    completed: completedBy.get(month) ?? 0,
    month,
    started: startedBy.get(month) ?? 0,
  }))
}

export interface TopCourse {
  completions: number
  enrollments: number
  id: number
  title: string
}

export const topCourses = (courses: EditorCourseRow[], limit = TOP_COURSES_LIMIT): TopCourse[] =>
  courses
    .filter(course => !course.archived && course.enrollments > 0)
    .toSorted((a, b) => b.enrollments - a.enrollments || a.id - b.id)
    .slice(0, limit)
    .map(({ completions, enrollments, id, title }) => ({ completions, enrollments, id, title }))

export interface EditorStats {
  averageRating: number | null
  completionRate: number | null
  enrollments: number
  ratings: number
}

export const summarizeEditorStats = (courses: EditorCourseRow[]): EditorStats => {
  const live = courses.filter(course => !course.archived)
  const enrollments = live.reduce((sum, course) => sum + course.enrollments, 0)
  const completions = live.reduce((sum, course) => sum + course.completions, 0)
  const ratings = live.reduce((sum, course) => sum + course.ratingCount, 0)
  const weighted = live.reduce((sum, course) => sum + (course.ratingAverage ?? 0) * course.ratingCount, 0)
  return {
    averageRating: ratings > 0 ? Math.round((weighted / ratings) * 10) / 10 : null,
    completionRate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : null,
    enrollments,
    ratings,
  }
}

export interface ManagerSummary {
  activeLinks: number
  activity: ActivityItem[]
  checklist: OrganizationChecklist
  isOwner: boolean
  members: { id: string; placeholder: string; url: string | null }[]
  pendingInvitations: number
  pendingJoinRequests: number
  pipeline: Pipeline
  stats: {
    admins: number
    learners: number
    members: number
    representatives: number
    tutors: number
    volunteers: number
  }
  waiting: WaitingSummary
}

export interface DashboardBase {
  firstName: string
  organization: string | null
}

export interface EligibilityView {
  avgRating: number | null
  completedSkillCount: number
  eligible: boolean
  hasLowRatings: boolean
  minRating: number
  minSkills: number
}

export interface MemberSummary {
  certificate: Certificate | null
  checklist: ChecklistItem[]
  courses: MemberCourseSummary
  eligibility: EligibilityView | null
  journey: MemberJourneyStep[] | null
  notifications: Notification[]
}

export interface EditorSummary {
  engagement: EngagementPoint[]
  health: ContentHealth
  pending: { organizations: number; team: number } | null
  stats: EditorStats
  top: TopCourse[]
}

export type DashboardData =
  | (DashboardBase & { view: 'none' })
  | (DashboardBase & { editor: EditorSummary; view: 'editor' })
  | (DashboardBase & { manager: ManagerSummary; view: 'manager' })
  | (DashboardBase & { member: MemberSummary; view: 'learner' | 'volunteer' })
  | (DashboardBase & { notifications: Notification[]; tutor: TutorSummary; view: 'tutor' })
