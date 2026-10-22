import 'server-only'

import { and, eq, inArray, isNull, sql } from 'drizzle-orm'

import { type Transaction, db } from '@/db/client'
import {
  activityEvents,
  certificateReviews,
  certificateSkills,
  certificates,
  contributions,
  courses,
  memberships,
  organizationJoinRequests,
  organizationRatings,
  regions,
  teamInvitations,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
  users,
} from '@/db/schema'

const ISSUED_CERTIFICATE_STATUSES = ['approved', 'revoked'] as const

const HOLDER_EVENT_KEYS = sql`array['comment', 'documentUrl', 'holderId', 'reason']`

const anonymizeIssuedCertificates = async (tx: Transaction, userId: string) => {
  const issued = await tx
    .select({
      documentUrl: certificates.documentUrl,
      id: certificates.id,
      organizationId: certificates.organizationId,
      reviewerId: certificates.reviewerId,
    })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), inArray(certificates.status, [...ISSUED_CERTIFICATE_STATUSES])))
  const ids = issued.map(({ id }) => id)
  if (ids.length === 0) return issued

  await tx
    .update(certificates)
    .set({
      activityDescription: '',
      activityLocation: '',
      documentUrl: null,
      holderDeletedAt: new Date().toISOString(),
      isDefault: false,
      rejectedReason: null,
      reviewerComment: null,
      revokedReason: null,
      snapshot: null,
      tasks: [],
      userId: null,
    })
    .where(inArray(certificates.id, ids))
  await tx
    .update(certificateSkills)
    .set({ evidence: null, statement: null })
    .where(inArray(certificateSkills.certificateId, ids))
  await tx
    .update(certificateReviews)
    .set({ comment: null, sectionComments: {} })
    .where(inArray(certificateReviews.certificateId, ids))
  await tx.update(organizationRatings).set({ comment: null }).where(inArray(organizationRatings.certificateId, ids))
  await tx
    .update(activityEvents)
    .set({ metadata: sql`${activityEvents.metadata} - ${HOLDER_EVENT_KEYS}` })
    .where(and(eq(activityEvents.subjectType, 'certificate'), inArray(activityEvents.subjectId, ids.map(String))))
  return issued
}

export const deleteUser = async (tx: Transaction, userId: string, { reassignTo }: { reassignTo?: string } = {}) => {
  const anonymized = await anonymizeIssuedCertificates(tx, userId)
  const remaining = tx.select({ id: certificates.id }).from(certificates).where(eq(certificates.userId, userId))

  await tx.delete(certificateSkills).where(inArray(certificateSkills.certificateId, remaining))
  await tx.update(certificates).set({ reviewerId: null }).where(eq(certificates.reviewerId, userId))
  await tx
    .update(organizationJoinRequests)
    .set({ reviewedBy: null })
    .where(eq(organizationJoinRequests.reviewedBy, userId))
  await tx.update(regions).set({ coordinatorId: null }).where(eq(regions.coordinatorId, userId))
  await tx.update(courses).set({ archivedById: null }).where(eq(courses.archivedById, userId))

  if (reassignTo) {
    await tx.update(courses).set({ creatorId: reassignTo }).where(eq(courses.creatorId, userId))
    await tx.update(teamInvitations).set({ invitedBy: reassignTo }).where(eq(teamInvitations.invitedBy, userId))
  }

  await tx.delete(certificates).where(eq(certificates.userId, userId))
  await tx.delete(userAssessments).where(eq(userAssessments.userId, userId))
  await tx.delete(userEvaluations).where(eq(userEvaluations.userId, userId))
  await tx.delete(userAnswers).where(eq(userAnswers.userId, userId))
  await tx.delete(userLessons).where(eq(userLessons.userId, userId))
  await tx.delete(userCourses).where(eq(userCourses.userId, userId))
  await tx.delete(contributions).where(eq(contributions.userId, userId))
  await tx.delete(teamInvitations).where(eq(teamInvitations.userId, userId))
  await tx.delete(memberships).where(eq(memberships.userId, userId))
  const [deleted] = await tx.delete(users).where(eq(users.id, userId)).returning({ avatarUrl: users.avatarUrl })
  return deleted && { ...deleted, anonymized }
}

export const mergeNotificationPreferences = async (
  userId: string,
  patch: Partial<Record<'learning' | 'organization' | 'reminders', boolean>>
) => {
  await db
    .update(users)
    .set({ notificationPreferences: sql`${users.notificationPreferences} || ${JSON.stringify(patch)}::jsonb` })
    .where(eq(users.id, userId))
}

export const completeOnboardingProfile = async (
  tx: Transaction,
  userId: string,
  values: {
    birthPlace: string
    birthday: string
    firstName: string
    lastName: string
    locale: string | null
    name: string
    nationality: string
    phone: string | null
    username: string
  }
) => {
  const [row] = await tx
    .update(users)
    .set({ ...values, onboardedAt: new Date().toISOString() })
    .where(and(eq(users.id, userId), isNull(users.onboardedAt)))
    .returning({ id: users.id })
  return row ?? null
}
