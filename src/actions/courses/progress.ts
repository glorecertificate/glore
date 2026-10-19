'use server'

import 'server-only'

import { revalidateTag, updateTag } from 'next/cache'

import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  assessments,
  courses,
  evaluations,
  lessons,
  questionOptions,
  questions,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
} from '@/db/schema'
import { type EnumType } from '@/db/types'
import { certificatesUserTag, progressUserTag } from '@/lib/cache'
import { type IntlRecord, LOCALES } from '@/lib/i18n'

const allowedCourseTypes = (role: EnumType<'role'>): EnumType<'course_type'>[] | null => {
  if (role === 'learner') return ['intro', 'learner']
  if (role === 'volunteer') return ['intro', 'skill']
  return null
}

const MAX_BATCH = 100

const unauthorized = () => ({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } })
const forbidden = () => ({ error: { code: 'FORBIDDEN', message: 'Not allowed' } })
const invalidInput = () => ({ error: { code: 'INVALID_INPUT', message: 'Invalid values' } })

const ratingSchema = z.number().int().min(1).max(5)
const idSchema = z.number().int().positive()
const evaluationRatingsSchema = z
  .array(z.object({ evaluationId: idSchema, value: ratingSchema }))
  .min(1)
  .max(MAX_BATCH)

const isCourseEditor = (user: { isEditor?: boolean | null; role?: string | null }) =>
  user.role === 'admin' || !!user.isEditor

const hasLessonAccess = async (
  user: { id: string; isEditor?: boolean | null; role?: string | null },
  ids: number[]
) => {
  const lessonIds = [...new Set(ids)]
  if (lessonIds.length === 0) return false

  const rows = isCourseEditor(user)
    ? await db.select({ id: lessons.id }).from(lessons).where(inArray(lessons.id, lessonIds))
    : await db
        .select({ id: lessons.id })
        .from(lessons)
        .innerJoin(userCourses, and(eq(userCourses.courseId, lessons.courseId), eq(userCourses.userId, user.id)))
        .where(inArray(lessons.id, lessonIds))

  return new Set(rows.map(({ id }) => id)).size === lessonIds.length
}

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
  if (!user) return unauthorized()

  const parsed = z
    .array(idSchema)
    .min(1)
    .max(MAX_BATCH)
    .safeParse(options.map(({ id }) => id))
  if (!parsed.success) return invalidInput()
  const optionIds = [...new Set(parsed.data)]

  const rows = await db
    .select({ id: questionOptions.id, lessonId: questions.lessonId })
    .from(questionOptions)
    .innerJoin(questions, eq(questions.id, questionOptions.questionId))
    .where(inArray(questionOptions.id, optionIds))
  if (rows.length !== optionIds.length) return invalidInput()
  const lessonIds = rows.map(({ lessonId }) => lessonId)
  if (!(await hasLessonAccess(user, lessonIds))) return forbidden()

  const result = await db
    .insert(userAnswers)
    .values(optionIds.map(optionId => ({ optionId, userId: user.id })))
    .onConflictDoNothing()
    .returning({ id: userAnswers.id })

  return { data: result }
}

export const enrollCourse = async (courseId: number, locale: string) => {
  const parsed = z.object({ courseId: idSchema, locale: z.enum(LOCALES) }).safeParse({ courseId, locale })
  if (!parsed.success) return invalidInput()

  const user = await getCurrentUser()
  if (user.banned) return forbidden()

  const existing = await db.query.userCourses.findFirst({
    where: and(eq(userCourses.userId, user.id), eq(userCourses.courseId, courseId)),
  })
  if (existing) return { data: existing }

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.archivedAt)),
    columns: { languages: true, type: true },
  })
  const enrollmentLocale = course?.languages?.includes(parsed.data.locale) ? parsed.data.locale : course?.languages?.[0]
  if (!(course && enrollmentLocale)) return forbidden()

  const orgId = await getActiveOrgId()
  const role = user.organizations.find(({ id }) => id === orgId)?.role
  if (!role) return forbidden()
  const allowedTypes = allowedCourseTypes(role)
  if (allowedTypes && !allowedTypes.includes(course.type ?? 'intro')) return forbidden()

  const [result] = await db
    .insert(userCourses)
    .values({ userId: user.id, courseId, locale: enrollmentLocale })
    .onConflictDoNothing()
    .returning()

  updateTag(progressUserTag(user.id))
  return { data: result }
}

export const completeLesson = async (lessonId: number) => {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  if (!idSchema.safeParse(lessonId).success) return invalidInput()
  if (!(await hasLessonAccess(user, [lessonId]))) return forbidden()

  const existing = await db.query.userLessons.findFirst({
    where: and(eq(userLessons.userId, user.id), eq(userLessons.lessonId, lessonId)),
  })
  if (existing) return { data: existing }

  const [result] = await db.insert(userLessons).values({ userId: user.id, lessonId }).onConflictDoNothing().returning()

  revalidateTag(certificatesUserTag(user.id), 'max')
  updateTag(progressUserTag(user.id))
  return { data: result }
}

export const submitEvaluationRatings = async (input: { evaluationId: number; value: number }[]) => {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const parsed = evaluationRatingsSchema.safeParse(input)
  if (!parsed.success) return invalidInput()
  const ratings = [...new Map(parsed.data.map(rating => [rating.evaluationId, rating])).values()]

  const ratingIds = ratings.map(({ evaluationId }) => evaluationId)
  const evaluationRows = await db.query.evaluations.findMany({
    where: inArray(evaluations.id, ratingIds),
    columns: { id: true, lessonId: true },
  })
  if (evaluationRows.length !== ratingIds.length) return invalidInput()

  const lessonIds = [...new Set(evaluationRows.map(({ lessonId }) => lessonId))]
  const canRate = await hasCompletedLessons(user.id, lessonIds)
  if (!canRate) return { error: { code: 'FORBIDDEN', message: 'Complete the lesson before submitting ratings' } }

  const existing = await db.query.userEvaluations.findMany({
    where: and(eq(userEvaluations.userId, user.id), inArray(userEvaluations.evaluationId, ratingIds)),
  })
  const existingIds = new Set(existing.map(e => e.evaluationId))
  const newRatings = ratings.filter(r => !existingIds.has(r.evaluationId))

  if (newRatings.length === 0) return { data: existing }

  const result = await db
    .insert(userEvaluations)
    .values(newRatings.map(({ evaluationId, value }) => ({ userId: user.id, evaluationId, value })))
    .onConflictDoNothing()
    .returning()

  revalidateTag(certificatesUserTag(user.id), 'max')
  updateTag(progressUserTag(user.id))
  return { data: [...existing, ...result] }
}

export const submitAssessmentRating = async (assessmentId: number, value: number) => {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  if (!(idSchema.safeParse(assessmentId).success && ratingSchema.safeParse(value).success)) return invalidInput()

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

  const [result] = await db
    .insert(userAssessments)
    .values({ userId: user.id, assessmentId, value })
    .onConflictDoNothing()
    .returning()

  revalidateTag(certificatesUserTag(user.id), 'max')
  updateTag(progressUserTag(user.id))
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
  if (!(authUser && isCourseEditor(authUser))) return { error: { code: 'UNAUTHORIZED', message: 'Not authorized' } }

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
