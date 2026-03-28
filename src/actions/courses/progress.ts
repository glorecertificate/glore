'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { and, asc, count, eq, inArray } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  assessments,
  evaluations,
  lessons,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
} from '@/db/schema'
import { certificatesUserTag } from '@/lib/cache'
import { type IntlRecord } from '@/lib/i18n'

const hasCompletedLessons = async (userId: string, lessonIds: number[]) => {
  if (lessonIds.length === 0) return false

  const completedLessons = await db.query.userLessons.findMany({
    where: and(eq(userLessons.userId, userId), inArray(userLessons.lessonId, lessonIds)),
    columns: { lessonId: true },
  })

  return new Set(completedLessons.flatMap(({ lessonId }) => (lessonId ? [lessonId] : []))).size === lessonIds.length
}

export const submitAnswers = async (options: { id: number }[]) => {
  const user = await getAuthUser()
  if (!user) return { error: new Error('Unauthorized') }

  const result = await db
    .insert(userAnswers)
    .values(options.map(({ id }) => ({ optionId: id, userId: user.id })))
    .returning({ id: userAnswers.id })

  return { data: result }
}

export const enrollCourse = async (courseId: number, locale: string) => {
  const user = await getAuthUser()
  if (!user) return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const existing = await db.query.userCourses.findFirst({
    where: and(eq(userCourses.userId, user.id), eq(userCourses.courseId, courseId)),
  })
  if (existing) return { data: existing }

  const [result] = await db.insert(userCourses).values({ userId: user.id, courseId, locale }).returning()

  return { data: result }
}

export const completeLesson = async (lessonId: number) => {
  const user = await getAuthUser()
  if (!user) return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const existing = await db.query.userLessons.findFirst({
    where: and(eq(userLessons.userId, user.id), eq(userLessons.lessonId, lessonId)),
  })
  if (existing) return { data: existing }

  const [result] = await db.insert(userLessons).values({ userId: user.id, lessonId }).returning()

  revalidateTag(certificatesUserTag(user.id), 'max')
  return { data: result }
}

export const submitEvaluationRatings = async (ratings: { evaluationId: number; value: number }[]) => {
  const user = await getAuthUser()
  if (!user) return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const ratingIds = ratings.map(({ evaluationId }) => evaluationId)
  const evaluationRows = await db.query.evaluations.findMany({
    where: inArray(evaluations.id, ratingIds),
    columns: { id: true, lessonId: true },
  })
  const lessonIds = [...new Set(evaluationRows.map(({ lessonId }) => lessonId))]
  const canRate = await hasCompletedLessons(user.id, lessonIds)
  if (!canRate) return { error: { code: 'FORBIDDEN', message: 'Complete the lesson before submitting ratings' } }

  const existing = await db.query.userEvaluations.findMany({
    where: and(
      eq(userEvaluations.userId, user.id),
      inArray(
        userEvaluations.evaluationId,
        ratings.map(r => r.evaluationId)
      )
    ),
  })
  const existingIds = new Set(existing.map(e => e.evaluationId))
  const newRatings = ratings.filter(r => !existingIds.has(r.evaluationId))

  if (newRatings.length === 0) return { data: existing }

  const result = await db
    .insert(userEvaluations)
    .values(newRatings.map(({ evaluationId, value }) => ({ userId: user.id, evaluationId, value })))
    .returning()

  revalidateTag(certificatesUserTag(user.id), 'max')
  return { data: [...existing, ...result] }
}

export const submitAssessmentRating = async (assessmentId: number, value: number) => {
  const user = await getAuthUser()
  if (!user) return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, assessmentId),
    columns: { lessonId: true },
  })
  if (!assessment) return { error: { code: 'NOT_FOUND', message: 'Assessment not found' } }

  const canRate = await hasCompletedLessons(user.id, [assessment.lessonId])
  if (!canRate) return { error: { code: 'FORBIDDEN', message: 'Complete the lesson before submitting ratings' } }

  const existing = await db.query.userAssessments.findFirst({
    where: and(eq(userAssessments.userId, user.id), eq(userAssessments.assessmentId, assessmentId)),
  })
  if (existing) return { data: existing }

  const [result] = await db.insert(userAssessments).values({ userId: user.id, assessmentId, value }).returning()

  revalidateTag(certificatesUserTag(user.id), 'max')
  return { data: result }
}

export interface CourseAnalyticsStats {
  enrollmentCount: number
  completionCount: number
  completionRate: number
  avgRating: number | null
  ratingDistribution: { value: number; count: number }[]
  lessonStats: {
    id: number
    title: IntlRecord | null
    completionCount: number
    completionRate: number
  }[]
}

export const getCourseAnalytics = async (courseId: number) => {
  const authUser = await getAuthUser()
  const isEditor = authUser?.role === 'admin' || authUser?.isEditor
  if (!isEditor) return { error: { code: 'UNAUTHORIZED', message: 'Not authorized' } }

  return await safeQuery(async () => {
    const [enrollmentResult, lessonsData] = await Promise.all([
      db.select({ total: count() }).from(userCourses).where(eq(userCourses.courseId, courseId)),
      db.query.lessons.findMany({
        where: eq(lessons.courseId, courseId),
        with: {
          userLessons: { columns: { id: true } },
          assessments: { with: { userAssessments: { columns: { value: true } } } },
        },
        orderBy: asc(lessons.sortOrder),
        limit: 200,
      }),
    ])

    const total = enrollmentResult[0]?.total ?? 0

    const lessonStats = lessonsData.map(lesson => ({
      id: lesson.id,
      title: lesson.title as IntlRecord | null,
      completionCount: lesson.userLessons.length,
      completionRate: total > 0 ? Math.round((lesson.userLessons.length / total) * 100) : 0,
    }))

    const completionCount = lessonStats.length > 0 ? Math.min(...lessonStats.map(l => l.completionCount)) : 0
    const completionRate = total > 0 ? Math.round((completionCount / total) * 100) : 0

    const allRatings = lessonsData.flatMap(l => (l.assessments[0]?.userAssessments ?? []).map(ua => ua.value))

    const avgRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, v) => sum + v, 0) / allRatings.length) * 10) / 10
        : null

    const ratingDistribution = [1, 2, 3, 4, 5].map(value => ({
      value,
      count: allRatings.filter(r => r === value).length,
    }))

    return {
      enrollmentCount: total,
      completionCount,
      completionRate,
      avgRating,
      ratingDistribution,
      lessonStats,
    } satisfies CourseAnalyticsStats
  })
}
