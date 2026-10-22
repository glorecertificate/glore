'use server'

import 'server-only'

import { eq, inArray } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { queryError } from '@/db/helpers'
import {
  activityEvents,
  certificateReviews,
  certificateSkills,
  certificates,
  courseRatings,
  memberships,
  notifications,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
  userSkillCompass,
  users,
} from '@/db/schema'
import { isRateLimited } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000

const buildAccountExport = async (userId: string) => {
  const user = await db.query.users.findFirst({
    columns: {
      avatarUrl: true,
      bio: true,
      birthPlace: true,
      birthday: true,
      city: true,
      country: true,
      createdAt: true,
      email: true,
      firstName: true,
      id: true,
      languages: true,
      lastName: true,
      locale: true,
      nationality: true,
      notificationPreferences: true,
      onboardedAt: true,
      phone: true,
      pronouns: true,
      publicProfile: true,
      sex: true,
      username: true,
    },
    where: eq(users.id, userId),
  })
  if (!user) return null

  const ownCertificates = await db.select().from(certificates).where(eq(certificates.userId, userId))
  const certificateIds = ownCertificates.map(({ id }) => id)

  const [
    organizationMemberships,
    skills,
    reviews,
    courses,
    lessons,
    answers,
    assessments,
    evaluations,
    compass,
    ratings,
    inbox,
    activity,
  ] = await Promise.all([
    db.query.memberships.findMany({
      columns: { createdAt: true, role: true },
      where: eq(memberships.userId, userId),
      with: { organization: { columns: { handle: true, name: true } } },
    }),
    certificateIds.length > 0
      ? db.select().from(certificateSkills).where(inArray(certificateSkills.certificateId, certificateIds))
      : [],
    certificateIds.length > 0
      ? db
          .select({
            certificateId: certificateReviews.certificateId,
            comment: certificateReviews.comment,
            createdAt: certificateReviews.createdAt,
            decision: certificateReviews.decision,
            sectionComments: certificateReviews.sectionComments,
          })
          .from(certificateReviews)
          .where(inArray(certificateReviews.certificateId, certificateIds))
      : [],
    db.select().from(userCourses).where(eq(userCourses.userId, userId)),
    db.select().from(userLessons).where(eq(userLessons.userId, userId)),
    db.select().from(userAnswers).where(eq(userAnswers.userId, userId)),
    db.select().from(userAssessments).where(eq(userAssessments.userId, userId)),
    db.select().from(userEvaluations).where(eq(userEvaluations.userId, userId)),
    db.select().from(userSkillCompass).where(eq(userSkillCompass.userId, userId)),
    db.select().from(courseRatings).where(eq(courseRatings.userId, userId)),
    db
      .select({
        createdAt: notifications.createdAt,
        data: notifications.data,
        readAt: notifications.readAt,
        type: notifications.type,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
    db
      .select({
        action: activityEvents.action,
        createdAt: activityEvents.createdAt,
        metadata: activityEvents.metadata,
        subjectId: activityEvents.subjectId,
        subjectType: activityEvents.subjectType,
      })
      .from(activityEvents)
      .where(eq(activityEvents.actorId, userId)),
  ])

  return {
    account: user,
    activity,
    certificates: ownCertificates.map(certificate => ({
      ...certificate,
      reviews: reviews.filter(({ certificateId }) => certificateId === certificate.id),
      skills: skills.filter(({ certificateId }) => certificateId === certificate.id),
    })),
    format: 'glore-account-export',
    generatedAt: new Date().toISOString(),
    learning: { answers, assessments, compass, courses, evaluations, lessons, ratings },
    memberships: organizationMemberships.map(({ organization, ...membership }) => ({
      ...membership,
      organization,
    })),
    notifications: inbox,
    version: 1,
  }
}

export const exportAccountData = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  if (await isRateLimited(`export:${user.id}`, 5, HOUR)) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many exports' } }
  }

  try {
    const data = await buildAccountExport(user.id)
    if (!data) return { data: null, error: { code: 'NOT_FOUND', message: 'User not found' } }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}
