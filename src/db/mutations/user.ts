import 'server-only'

import { and, eq, inArray, isNull, sql } from 'drizzle-orm'

import { type Transaction, db } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { releaseTutorAssignments } from '@/db/mutations/organization'
import { type AppEvent } from '@/db/queries/activity-event'
import { OPEN_CERTIFICATE_STATUSES } from '@/db/queries/certificate'
import {
  certificateSkills,
  certificates,
  contributions,
  courses,
  memberships,
  organizationJoinRequests,
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

const detachIssuedCertificates = async (tx: Transaction, userId: string) => {
  const issued = await tx
    .select({ id: certificates.id, organizationId: certificates.organizationId, reviewerId: certificates.reviewerId })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), inArray(certificates.status, [...ISSUED_CERTIFICATE_STATUSES])))
  if (issued.length === 0) return issued

  await tx
    .update(certificates)
    .set({ holderDeletedAt: new Date().toISOString(), isDefault: false, userId: null })
    .where(
      inArray(
        certificates.id,
        issued.map(({ id }) => id)
      )
    )
  return issued
}

const releaseOpenReviews = async (tx: Transaction, tutorId: string, actorId: string) => {
  const pools = await tx
    .selectDistinct({ organizationId: certificates.organizationId })
    .from(certificates)
    .where(and(eq(certificates.reviewerId, tutorId), inArray(certificates.status, [...OPEN_CERTIFICATE_STATUSES])))
  const events: AppEvent[] = []
  for (const { organizationId } of pools) {
    events.push(...(await releaseTutorAssignments(tx, { actorId, organizationId, tutorId })))
  }
  await mapSequential(events, event => recordEvent(tx, event))
  return events
}

export const deleteUser = async (
  tx: Transaction,
  userId: string,
  { actorId = userId, reassignTo }: { actorId?: string; reassignTo?: string } = {}
) => {
  const detached = await detachIssuedCertificates(tx, userId)
  const owned = await tx
    .select({ organizationId: certificates.organizationId, reviewerId: certificates.reviewerId })
    .from(certificates)
    .where(eq(certificates.userId, userId))
  const joined = await tx
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(eq(memberships.userId, userId))
  const events = await releaseOpenReviews(tx, userId, actorId)
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
  return (
    deleted && {
      ...deleted,
      certificates: [...detached, ...owned].map(({ organizationId, reviewerId }) => ({ organizationId, reviewerId })),
      events,
      organizationIds: joined.map(({ organizationId }) => organizationId),
    }
  )
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
