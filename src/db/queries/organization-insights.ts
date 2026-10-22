import { type CertificateStatus } from '@/db/queries/certificate'
import { type OrganizationMembershipRole } from '@/db/queries/organization'

export const RATING_MIN_COUNT = 3

export const PIPELINE_STATUSES = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn',
  'revoked',
] as const satisfies CertificateStatus[]

type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

export type Pipeline = Record<PipelineStatus, number>

const emptyPipeline = () => Object.fromEntries(PIPELINE_STATUSES.map(status => [status, 0])) as unknown as Pipeline

export const toPipeline = (rows: { status: CertificateStatus; total: number }[]) => {
  const pipeline = emptyPipeline()
  for (const { status, total } of rows) {
    if (status in pipeline) pipeline[status as PipelineStatus] = total
  }
  return pipeline
}

export interface OrganizationChecklist {
  certificate: boolean
  completed: number
  profile: boolean
  total: number
  tutor: boolean
  volunteers: boolean
}

export const buildChecklist = ({
  certificateCount,
  invitedRoles,
  legalName,
  legalRepresentative,
  memberRoles,
  registryId,
}: {
  certificateCount: number
  invitedRoles: OrganizationMembershipRole[]
  legalName: string | null
  legalRepresentative: string | null
  memberRoles: OrganizationMembershipRole[]
  registryId: string | null
}): OrganizationChecklist => {
  const roles = [...memberRoles, ...invitedRoles]
  const steps = {
    certificate: certificateCount > 0,
    profile: Boolean(legalName?.trim() && registryId?.trim() && legalRepresentative?.trim()),
    tutor: roles.includes('tutor'),
    volunteers: roles.includes('volunteer'),
  }
  const total = Object.keys(steps).length
  return { ...steps, completed: Object.values(steps).filter(Boolean).length, total }
}

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

export const lastMonths = (now: Date, count = 12) => {
  const keys: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))))
  }
  return keys
}

export const toMonthlySeries = (
  months: string[],
  submitted: { month: string; total: number }[],
  approved: { month: string; total: number }[]
) => {
  const submittedBy = new Map(submitted.map(({ month, total }) => [month, total]))
  const approvedBy = new Map(approved.map(({ month, total }) => [month, total]))
  return months.map(month => ({
    approved: approvedBy.get(month) ?? 0,
    month,
    submitted: submittedBy.get(month) ?? 0,
  }))
}

export interface RatingAggregate {
  certificationSupport: number | null
  count: number
  experience: number | null
  recommendTotal: number
  recommended: number
  support: number | null
}

export type RatingSummary =
  | { count: number; ready: false }
  | {
      certificationSupport: number | null
      count: number
      experience: number | null
      ready: true
      recommendRate: number | null
      support: number | null
    }

export const summarizeRatings = (aggregate: RatingAggregate): RatingSummary => {
  if (aggregate.count < RATING_MIN_COUNT) return { count: aggregate.count, ready: false }
  return {
    certificationSupport: aggregate.certificationSupport,
    count: aggregate.count,
    experience: aggregate.experience,
    ready: true,
    recommendRate: aggregate.recommendTotal > 0 ? aggregate.recommended / aggregate.recommendTotal : null,
    support: aggregate.support,
  }
}

export interface TutorWorkload {
  open: number
  reviewed: number
  tutorId: string
}

const OPEN_STATUSES = new Set<CertificateStatus>(['submitted', 'in_review', 'changes_requested'])
const REVIEWED_STATUSES = new Set<CertificateStatus>(['approved', 'rejected', 'revoked'])

export const toTutorWorkload = (
  tutorIds: string[],
  rows: { reviewerId: string; status: CertificateStatus; total: number }[]
) => {
  const workload = new Map<string, TutorWorkload>(tutorIds.map(tutorId => [tutorId, { open: 0, reviewed: 0, tutorId }]))
  for (const { reviewerId, status, total } of rows) {
    const entry = workload.get(reviewerId)
    if (!entry) continue
    if (OPEN_STATUSES.has(status)) entry.open += total
    if (REVIEWED_STATUSES.has(status)) entry.reviewed += total
  }
  return [...workload.values()].toSorted((a, b) => b.open - a.open || b.reviewed - a.reviewed)
}

export interface ActivityRecord {
  action: string
  actorId: string | null
  createdAt: string
  id: number
  metadata: Record<string, unknown>
}

export interface ActivityItem {
  action: string
  actor: string | null
  createdAt: string
  id: number
  previousRole: OrganizationMembershipRole | null
  role: OrganizationMembershipRole | null
  target: string | null
  tutor: string | null
}

const stringOf = (value: unknown) => (typeof value === 'string' && value ? value : null)

const ROLES: OrganizationMembershipRole[] = ['admin', 'learner', 'representative', 'tutor', 'volunteer']

const roleOf = (value: unknown) => ROLES.find(role => role === value) ?? null

const activityTargetId = ({ action, metadata }: Pick<ActivityRecord, 'action' | 'metadata'>) => {
  if (action.startsWith('certificate.')) return stringOf(metadata.holderId)
  if (action === 'organization.ownership_transferred') return stringOf(metadata.newOwnerId)
  if (['course.', 'invitation.', 'learning.', 'member.'].some(prefix => action.startsWith(prefix))) {
    return stringOf(metadata.userId)
  }
  return null
}

const activityInvitationId = ({ action, metadata }: Pick<ActivityRecord, 'action' | 'metadata'>) =>
  action.startsWith('invitation.') && typeof metadata.invitationId === 'number' ? metadata.invitationId : null

export const activityInvitationIds = (records: ActivityRecord[]) => [
  ...new Set(records.flatMap(record => activityInvitationId(record) ?? [])),
]

const activityTutorId = ({ action, metadata }: Pick<ActivityRecord, 'action' | 'metadata'>) =>
  action.startsWith('certificate.') ? (stringOf(metadata.tutorId) ?? stringOf(metadata.previousTutorId)) : null

export const activityUserIds = (records: ActivityRecord[]) => {
  const ids = new Set<string>()
  for (const record of records) {
    for (const id of [record.actorId, activityTargetId(record), activityTutorId(record)]) {
      if (id) ids.add(id)
    }
  }
  return [...ids]
}

export const toActivityItems = (
  records: ActivityRecord[],
  names: Map<string, string>,
  invitees = new Map<number, string>()
): ActivityItem[] =>
  records.map(record => {
    const targetId = activityTargetId(record)
    const invitationId = activityInvitationId(record)
    const tutorId = activityTutorId(record)
    return {
      action: record.action,
      actor: (record.actorId && names.get(record.actorId)) || null,
      createdAt: record.createdAt,
      id: record.id,
      previousRole: roleOf(record.metadata.previousRole),
      role: roleOf(record.metadata.role),
      target:
        (targetId && names.get(targetId)) ||
        (invitationId !== null && invitees.get(invitationId)) ||
        stringOf(record.metadata.name),
      tutor: (tutorId && names.get(tutorId)) || null,
    }
  })

export const activityMessageKey = (action: string) => `activity_${action.replaceAll('.', '_')}`
