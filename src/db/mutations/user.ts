import 'server-only'

import { eq, inArray } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
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

/* eslint-disable react-doctor/async-parallel */
export const deleteUser = async (tx: Transaction, userId: string, { reassignTo }: { reassignTo?: string } = {}) => {
  const userCertificates = tx.select({ id: certificates.id }).from(certificates).where(eq(certificates.userId, userId))

  await tx.delete(certificateSkills).where(inArray(certificateSkills.certificateId, userCertificates))
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
  await tx.delete(users).where(eq(users.id, userId))
}
