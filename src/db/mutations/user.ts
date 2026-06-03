import 'server-only'

import { eq, inArray } from 'drizzle-orm'

import { db } from '@/db/client'
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

export const deleteUser = async (userId: string, { reassignTo }: { reassignTo?: string } = {}) => {
  const userCertificates = db.select({ id: certificates.id }).from(certificates).where(eq(certificates.userId, userId))

  // eslint-disable-next-line react-doctor/async-parallel
  await Promise.all([
    db.delete(certificateSkills).where(inArray(certificateSkills.certificateId, userCertificates)),
    db.update(certificates).set({ reviewerId: null }).where(eq(certificates.reviewerId, userId)),
    db
      .update(organizationJoinRequests)
      .set({ reviewedBy: null })
      .where(eq(organizationJoinRequests.reviewedBy, userId)),
    db.update(regions).set({ coordinatorId: null }).where(eq(regions.coordinatorId, userId)),
    db.update(courses).set({ archivedById: null }).where(eq(courses.archivedById, userId)),
    reassignTo
      ? db.update(courses).set({ creatorId: reassignTo }).where(eq(courses.creatorId, userId))
      : Promise.resolve(),
    reassignTo
      ? db.update(teamInvitations).set({ invitedBy: reassignTo }).where(eq(teamInvitations.invitedBy, userId))
      : Promise.resolve(),
  ])

  await Promise.all([
    db.delete(certificates).where(eq(certificates.userId, userId)),
    db.delete(userAssessments).where(eq(userAssessments.userId, userId)),
    db.delete(userEvaluations).where(eq(userEvaluations.userId, userId)),
    db.delete(userAnswers).where(eq(userAnswers.userId, userId)),
    db.delete(userLessons).where(eq(userLessons.userId, userId)),
    db.delete(userCourses).where(eq(userCourses.userId, userId)),
    db.delete(contributions).where(eq(contributions.userId, userId)),
    db.delete(teamInvitations).where(eq(teamInvitations.userId, userId)),
    db.delete(memberships).where(eq(memberships.userId, userId)),
  ])

  await db.delete(users).where(eq(users.id, userId))
}
