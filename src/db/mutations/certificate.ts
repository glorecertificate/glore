import 'server-only'

import { type SQL, and, count, desc, eq, inArray, isNotNull, isNull, ne, notInArray, or, sql } from 'drizzle-orm'

import { chooseTutor } from '@/components/features/certificates/rules'
import {
  type CertificateEditValues,
  type CertificateRequestValues,
  type PersonalDataValues,
} from '@/components/features/certificates/schemas'
import { type Transaction } from '@/db/client'
import { type CertificateStatus, OPEN_CERTIFICATE_STATUSES } from '@/db/queries/certificate'
import {
  type CertificateSnapshot,
  activityEvents,
  certificateReviews,
  certificateSkills,
  certificates,
  memberships,
  organizationRatings,
  users,
} from '@/db/schema'
import { DEFAULT_LOCALE } from '@/lib/i18n'

export const MAX_CERTIFICATE_DRAFTS = 5

type CertificateErrorCode =
  | 'ACTIVITY_TOO_SHORT'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INVALID_INPUT'
  | 'INVALID_STATE'
  | 'NOT_ELIGIBLE'
  | 'NOT_FOUND'
  | 'PERSONAL_DATA_MISSING'
  | 'RATE_LIMITED'
  | 'STORAGE_FAILED'
  | 'UNAUTHORIZED'

export class CertificateError extends Error {
  readonly code: CertificateErrorCode

  constructor(code: CertificateErrorCode, message: string) {
    super(message)
    this.name = 'CertificateError'
    this.code = code
  }
}

type CertificateRow = typeof certificates.$inferSelect
type CertificateSkillRow = typeof certificateSkills.$inferSelect

const now = () => new Date().toISOString()

const lock = async (tx: Transaction, key: string) => {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`)
}

const lockRequests = async (tx: Transaction, userId: string, organizationId: number) =>
  await lock(tx, `certificate:${userId}:${organizationId}`)

interface Transition {
  from: readonly CertificateStatus[]
  guard?: SQL
  id: number
  set: Partial<typeof certificates.$inferInsert>
}

const transition = async (tx: Transaction, { from, guard, id, set }: Transition) => {
  const [row] = await tx
    .update(certificates)
    .set(set)
    .where(and(eq(certificates.id, id), inArray(certificates.status, [...from]), isNotNull(certificates.userId), guard))
    .returning()
  if (!row?.userId) throw new CertificateError('INVALID_STATE', 'Certificate is not in a state that allows this action')
  return { ...row, userId: row.userId }
}

const contentColumns = (edit: CertificateEditValues) => ({
  activityDescription: edit.activityDescription,
  activityDuration: edit.activityDuration,
  activityEndDate: edit.activityEndDate,
  activityLocation: edit.activityLocation,
  activityStartDate: edit.activityStartDate,
  language: edit.language,
  tasks: edit.tasks,
})

const writeRelations = async (
  tx: Transaction,
  { id, organizationId }: Pick<CertificateRow, 'id' | 'organizationId'>,
  { rating, skills }: CertificateEditValues
) => {
  if (skills) {
    const courseIds = skills.map(({ courseId }) => courseId)
    await tx
      .delete(certificateSkills)
      .where(
        courseIds.length > 0
          ? and(eq(certificateSkills.certificateId, id), notInArray(certificateSkills.courseId, courseIds))
          : eq(certificateSkills.certificateId, id)
      )
    for (const [index, skill] of skills.entries()) {
      const values = { evidence: skill.evidence ?? null, selfLevel: skill.selfLevel ?? null, sortOrder: index }
      await tx
        .insert(certificateSkills)
        .values({ certificateId: id, courseId: skill.courseId, ...values })
        .onConflictDoUpdate({ set: values, target: [certificateSkills.certificateId, certificateSkills.courseId] })
    }
  }

  if (rating) {
    await tx
      .insert(organizationRatings)
      .values({ certificateId: id, organizationId, ...rating })
      .onConflictDoUpdate({ set: { ...rating, updatedAt: now() }, target: organizationRatings.certificateId })
  }
}

interface CreateDraftParams {
  edit: CertificateEditValues
  organizationId: number
  userId: string
}

export const createCertificateDraft = async (tx: Transaction, { edit, organizationId, userId }: CreateDraftParams) => {
  await lockRequests(tx, userId, organizationId)

  const [drafts] = await tx
    .select({ total: count() })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, userId),
        eq(certificates.organizationId, organizationId),
        eq(certificates.status, 'draft')
      )
    )
  if ((drafts?.total ?? 0) >= MAX_CERTIFICATE_DRAFTS) {
    throw new CertificateError('CONFLICT', 'Too many drafts for this organization')
  }

  const [created] = await tx
    .insert(certificates)
    .values({
      activityDescription: edit.activityDescription ?? '',
      activityDuration: edit.activityDuration ?? 0,
      activityEndDate: edit.activityEndDate ?? '',
      activityLocation: edit.activityLocation ?? '',
      activityStartDate: edit.activityStartDate ?? '',
      handle: `${userId}-${organizationId}-${Date.now()}`,
      language: edit.language ?? DEFAULT_LOCALE,
      organizationId,
      status: 'draft',
      tasks: edit.tasks ?? [],
      userId,
    })
    .returning()
  if (!created) throw new Error('Failed to create certificate')

  await writeRelations(tx, created, edit)
  return created
}

interface UpdateDraftParams {
  edit: CertificateEditValues
  id: number
  userId: string
}

export const updateCertificateDraft = async (tx: Transaction, { edit, id, userId }: UpdateDraftParams) => {
  const row = await transition(tx, {
    from: ['draft'],
    guard: eq(certificates.userId, userId),
    id,
    set: { ...contentColumns(edit), updatedAt: now() },
  })
  await writeRelations(tx, row, edit)
  return row
}

export const removeCertificateDraft = async (tx: Transaction, { id, userId }: { id: number; userId: string }) => {
  const [deleted] = await tx
    .delete(certificates)
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId), eq(certificates.status, 'draft')))
    .returning({ id: certificates.id })
  if (!deleted) throw new CertificateError('NOT_FOUND', 'Draft not found')
  return deleted
}

const BANNED_FILTER = or(isNull(users.banned), eq(users.banned, false))

export const isAssignableTutor = async (
  tx: Pick<Transaction, 'select'>,
  { authorId, organizationId, tutorId }: { authorId: string; organizationId: number; tutorId: string }
) => {
  if (tutorId === authorId) return false
  const [tutor] = await tx
    .select({ userId: memberships.userId })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.userId, tutorId),
        eq(memberships.organizationId, organizationId),
        eq(memberships.role, 'tutor'),
        BANNED_FILTER
      )
    )
  return Boolean(tutor)
}

export const tutorLoads = async (tx: Pick<Transaction, 'select'>, organizationId: number, authorId: string) =>
  await tx
    .select({
      lastAssignedAt: sql<string | null>`(
        select max(${activityEvents.createdAt}) from ${activityEvents}
        where ${activityEvents.organizationId} = ${organizationId}
          and ${activityEvents.action} in ('certificate.submitted', 'certificate.assigned')
          and ${activityEvents.metadata} ->> 'tutorId' = ${memberships.userId}
      )`,
      openRequests: sql<number>`(
        select count(*)::int from ${certificates}
        where ${certificates.reviewerId} = ${memberships.userId}
          and ${certificates.organizationId} = ${organizationId}
          and ${inArray(certificates.status, [...OPEN_CERTIFICATE_STATUSES])}
      )`,
      userId: memberships.userId,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.role, 'tutor'),
        ne(memberships.userId, authorId),
        BANNED_FILTER
      )
    )

const pickReviewer = async (tx: Transaction, organizationId: number, authorId: string) => {
  await lock(tx, `certificate-assign:${organizationId}`)
  return chooseTutor(await tutorLoads(tx, organizationId, authorId))
}

interface SubmitParams {
  code: string
  edit: CertificateRequestValues
  from: 'changes_requested' | 'draft'
  id: number
  organizationId: number
  personal?: PersonalDataValues
  userId: string
}

export const submitCertificateRequest = async (
  tx: Transaction,
  { code, edit, from, id, organizationId, personal, userId }: SubmitParams
) => {
  await lockRequests(tx, userId, organizationId)

  if (from === 'draft') {
    const open = await tx.query.certificates.findFirst({
      columns: { id: true },
      where: and(
        eq(certificates.userId, userId),
        eq(certificates.organizationId, organizationId),
        inArray(certificates.status, [...OPEN_CERTIFICATE_STATUSES]),
        ne(certificates.id, id)
      ),
    })
    if (open) throw new CertificateError('CONFLICT', 'An open certificate request already exists for this organization')
  }

  if (personal && Object.keys(personal).length > 0) {
    await tx.update(users).set(personal).where(eq(users.id, userId))
  }

  const current = await tx.query.certificates.findFirst({
    columns: { code: true, reviewerId: true },
    where: and(eq(certificates.id, id), eq(certificates.userId, userId)),
  })
  if (!current) throw new CertificateError('NOT_FOUND', 'Certificate not found')

  const keepReviewer =
    from === 'changes_requested' &&
    current.reviewerId !== null &&
    (await isAssignableTutor(tx, { authorId: userId, organizationId, tutorId: current.reviewerId }))
  const reviewerId = keepReviewer ? current.reviewerId : await pickReviewer(tx, organizationId, userId)

  const row = await transition(tx, {
    from: [from],
    guard: eq(certificates.userId, userId),
    id,
    set: {
      ...contentColumns(edit),
      code: current.code ?? code,
      reviewerComment: null,
      reviewerId,
      status: 'submitted',
      submittedAt: now(),
    },
  })
  await writeRelations(tx, row, edit)
  return { previousReviewerId: current.reviewerId, row }
}

export const withdrawCertificateRequest = async (tx: Transaction, { id, userId }: { id: number; userId: string }) =>
  await transition(tx, {
    from: OPEN_CERTIFICATE_STATUSES,
    guard: eq(certificates.userId, userId),
    id,
    set: { status: 'withdrawn', withdrawnAt: now() },
  })

export const recordFeaturedCertificate = async (tx: Transaction, { id, userId }: { id: number; userId: string }) => {
  const row = await tx.query.certificates.findFirst({
    columns: { id: true, organizationId: true, status: true },
    where: and(eq(certificates.id, id), eq(certificates.userId, userId)),
  })
  if (!row) throw new CertificateError('NOT_FOUND', 'Certificate not found')
  const featurable = row.status === 'approved'
  if (!featurable) throw new CertificateError('INVALID_STATE', 'Only approved certificates can be featured')

  await tx
    .update(certificates)
    .set({ isDefault: false })
    .where(and(eq(certificates.userId, userId), eq(certificates.isDefault, true), ne(certificates.id, id)))
  await tx.update(certificates).set({ isDefault: true }).where(eq(certificates.id, id))
  return row
}

export const startCertificateReview = async (tx: Transaction, { id, reviewerId }: { id: number; reviewerId: string }) =>
  await transition(tx, {
    from: ['submitted'],
    guard: and(eq(certificates.reviewerId, reviewerId), ne(certificates.userId, reviewerId)),
    id,
    set: { status: 'in_review' },
  })

interface AssignParams {
  expected: Pick<CertificateRow, 'reviewerId' | 'status'>
  id: number
  reviewerId: string | null
}

export const assignCertificate = async (tx: Transaction, { expected, id, reviewerId }: AssignParams) => {
  const holder = reviewerId ? ne(certificates.userId, reviewerId) : undefined
  const current = expected.reviewerId
    ? eq(certificates.reviewerId, expected.reviewerId)
    : isNull(certificates.reviewerId)
  return await transition(tx, {
    from: [expected.status],
    guard: and(current, holder),
    id,
    set: { reviewerId, status: expected.status === 'in_review' ? 'submitted' : expected.status },
  })
}

interface ReviewRecord {
  comment?: string | null
  decision: typeof certificateReviews.$inferInsert.decision
  reviewerId: string
  scores?: { engagement: number; evidence: number; growth: number; reflection: number }
  sectionComments?: typeof certificateReviews.$inferInsert.sectionComments
}

const recordReview = async (tx: Transaction, id: number, review: ReviewRecord) => {
  const [row] = await tx
    .insert(certificateReviews)
    .values({
      certificateId: id,
      comment: review.comment || null,
      decision: review.decision,
      reviewerId: review.reviewerId,
      scoreEngagement: review.scores?.engagement,
      scoreEvidence: review.scores?.evidence,
      scoreGrowth: review.scores?.growth,
      scoreReflection: review.scores?.reflection,
      sectionComments: review.sectionComments,
    })
    .returning({ id: certificateReviews.id })
  if (!row) throw new Error('Failed to record review')
  return row.id
}

const reviewerGuard = (reviewerId: string) =>
  and(eq(certificates.reviewerId, reviewerId), ne(certificates.userId, reviewerId))

interface RequestChangesParams {
  comment?: string
  id: number
  reviewerId: string
  sectionComments?: typeof certificateReviews.$inferInsert.sectionComments
}

export const recordCertificateChanges = async (
  tx: Transaction,
  { comment, id, reviewerId, sectionComments }: RequestChangesParams
) => {
  const row = await transition(tx, {
    from: ['submitted', 'in_review'],
    guard: reviewerGuard(reviewerId),
    id,
    set: { reviewedAt: now(), reviewerComment: comment || null, status: 'changes_requested' },
  })
  await recordReview(tx, id, { comment, decision: 'changes_requested', reviewerId, sectionComments })
  return row
}

export const recordCertificateRejection = async (
  tx: Transaction,
  { id, reason, reviewerId }: { id: number; reason: string; reviewerId: string }
) => {
  const row = await transition(tx, {
    from: ['submitted', 'in_review', 'changes_requested'],
    guard: reviewerGuard(reviewerId),
    id,
    set: { rejectedReason: reason, reviewedAt: now(), status: 'rejected' },
  })
  await recordReview(tx, id, { comment: reason, decision: 'rejected', reviewerId })
  return row
}

interface ApproveParams {
  code: string
  edit: CertificateEditValues
  expectedUpdatedAt: string
  id: number
  issuedAt: string
  review: Pick<ReviewRecord, 'comment' | 'scores'>
  reviewerId: string
  skills: { courseId: number; level: number; statement: string | null }[]
  snapshot: CertificateSnapshot
}

export const recordCertificateApproval = async (
  tx: Transaction,
  { code, edit, expectedUpdatedAt, id, issuedAt, review, reviewerId, skills, snapshot }: ApproveParams
) => {
  const row = await transition(tx, {
    from: ['submitted', 'in_review'],
    guard: and(reviewerGuard(reviewerId), eq(certificates.updatedAt, expectedUpdatedAt)),
    id,
    set: { ...contentColumns(edit), code, issuedAt, reviewedAt: issuedAt, snapshot, status: 'approved' },
  })

  await tx.delete(certificateSkills).where(
    and(
      eq(certificateSkills.certificateId, id),
      notInArray(
        certificateSkills.courseId,
        skills.map(({ courseId }) => courseId)
      )
    )
  )
  for (const [index, skill] of skills.entries()) {
    await tx
      .update(certificateSkills)
      .set({ level: skill.level, sortOrder: index, statement: skill.statement })
      .where(and(eq(certificateSkills.certificateId, id), eq(certificateSkills.courseId, skill.courseId)))
  }

  const existingDefault = await tx.query.certificates.findFirst({
    columns: { id: true },
    where: and(eq(certificates.userId, row.userId), eq(certificates.isDefault, true)),
  })
  if (!existingDefault) await tx.update(certificates).set({ isDefault: true }).where(eq(certificates.id, id))

  const reviewId = await recordReview(tx, id, { ...review, decision: 'approved', reviewerId })
  return { certificate: row, reviewId }
}

export interface CertificateBackup {
  certificate: CertificateRow
  skills: CertificateSkillRow[]
}

interface RevertApprovalParams {
  approvedAt: string
  backup: CertificateBackup
  eventId: number
  reviewId: number
}

export const revertCertificateApproval = async (
  tx: Transaction,
  { approvedAt, backup, eventId, reviewId }: RevertApprovalParams
) => {
  const { certificate, skills } = backup
  const [reverted] = await tx
    .update(certificates)
    .set({
      activityDescription: certificate.activityDescription,
      activityDuration: certificate.activityDuration,
      activityEndDate: certificate.activityEndDate,
      activityLocation: certificate.activityLocation,
      activityStartDate: certificate.activityStartDate,
      code: certificate.code,
      documentUrl: null,
      isDefault: certificate.isDefault,
      issuedAt: null,
      reviewedAt: certificate.reviewedAt,
      snapshot: null,
      status: certificate.status,
      tasks: certificate.tasks,
    })
    .where(
      and(
        eq(certificates.id, certificate.id),
        eq(certificates.status, 'approved'),
        eq(certificates.issuedAt, approvedAt)
      )
    )
    .returning({ id: certificates.id })
  if (!reverted) throw new CertificateError('CONFLICT', 'Certificate changed before the approval could be reverted')

  await tx.delete(certificateSkills).where(eq(certificateSkills.certificateId, certificate.id))
  if (skills.length > 0) {
    await tx.insert(certificateSkills).values(
      skills.map(skill => ({
        certificateId: skill.certificateId,
        courseId: skill.courseId,
        evidence: skill.evidence,
        level: skill.level,
        selfLevel: skill.selfLevel,
        sortOrder: skill.sortOrder,
        statement: skill.statement,
      }))
    )
  }
  await tx.delete(certificateReviews).where(eq(certificateReviews.id, reviewId))
  await tx.delete(activityEvents).where(eq(activityEvents.id, eventId))
}

interface RevokeParams {
  id: number
  reason: string
  revokedById: string
}

export const recordCertificateRevocation = async (tx: Transaction, { id, reason, revokedById }: RevokeParams) => {
  const row = await transition(tx, {
    from: ['approved'],
    id,
    set: { isDefault: false, revokedAt: now(), revokedById, revokedReason: reason, status: 'revoked' },
  })

  const currentDefault = await tx.query.certificates.findFirst({
    columns: { id: true },
    where: and(
      eq(certificates.userId, row.userId),
      eq(certificates.isDefault, true),
      eq(certificates.status, 'approved')
    ),
  })
  if (currentDefault) return row

  const next = await tx.query.certificates.findFirst({
    columns: { id: true },
    orderBy: desc(certificates.issuedAt),
    where: and(eq(certificates.userId, row.userId), eq(certificates.status, 'approved')),
  })
  if (next) await tx.update(certificates).set({ isDefault: true }).where(eq(certificates.id, next.id))
  return row
}
