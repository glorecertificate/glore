'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache } from 'react'

import { and, asc, count, eq, inArray, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Course, parseCourse } from '@/db/queries/course'
import { DEFAULT_LESSON, parseLesson } from '@/db/queries/lesson'
import {
  assessments,
  courses,
  evaluations,
  lessons,
  questions,
  skillGroups,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
} from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag, certificatesUserTag, courseTag } from '@/lib/cache'
import { type IntlRecord } from '@/lib/i18n'

const courseWith = {
  skillGroup: { columns: { id: true, name: true } },
  creator: {
    with: {
      memberships: { with: { organization: { columns: { id: true, name: true, avatarUrl: true } } } },
      regions: { columns: { id: true, name: true, icon: true } },
    },
  },
  lessons: {
    with: {
      contributions: {
        with: {
          user: {
            with: {
              memberships: { with: { organization: { columns: { id: true, name: true, avatarUrl: true } } } },
              regions: { columns: { id: true, name: true, icon: true } },
            },
          },
        },
      },
      questions: { with: { options: { with: { userAnswers: { columns: { id: true } } } } } },
      evaluations: { with: { userEvaluations: { columns: { id: true, value: true } } } },
      assessments: { with: { userAssessments: { columns: { id: true, value: true } } } },
      userLessons: { columns: { id: true } },
    },
  },
  userCourses: { columns: { id: true } },
} as const

const buildCourseWith = (userId?: string) => {
  if (!userId) return courseWith
  return {
    ...courseWith,
    lessons: {
      with: {
        ...courseWith.lessons.with,
        questions: {
          with: {
            options: { with: { userAnswers: { where: eq(userAnswers.userId, userId), columns: { id: true } } } },
          },
        },
        evaluations: {
          with: { userEvaluations: { where: eq(userEvaluations.userId, userId), columns: { id: true, value: true } } },
        },
        assessments: {
          with: { userAssessments: { where: eq(userAssessments.userId, userId), columns: { id: true, value: true } } },
        },
        userLessons: { where: eq(userLessons.userId, userId), columns: { id: true } },
      },
    },
    userCourses: { where: eq(userCourses.userId, userId), columns: { id: true } },
  } as unknown as typeof courseWith
}

const fetchCourse = cache(async (slug: string, userId?: string) => {
  'use cache'
  cacheTag(courseTag(slug))

  return await safeQuery(async () => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
      with: buildCourseWith(userId),
    })
    if (!course) throw new Error('Course not found')
    return parseCourse({
      ...course,
      lessons: course.lessons.map(lesson => ({
        ...lesson,
        assessment: lesson.assessments[0] ?? null,
      })),
    })
  })
})

const fetchCourses = cache(async (userId?: string) => {
  'use cache'
  cacheTag(CacheTag.Courses)

  return await safeQuery(async () => {
    const result = await db.query.courses.findMany({ with: buildCourseWith(userId), limit: 200 })
    return result.map(course =>
      parseCourse({
        ...course,
        lessons: course.lessons.map(lesson => ({
          ...lesson,
          assessment: lesson.assessments[0] ?? null,
        })),
      })
    )
  })
})

export const getCourse = async (slug: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const userId = authUser?.id
  if (!useCache) {
    return await safeQuery(async () => {
      const course = await db.query.courses.findFirst({
        where: eq(courses.slug, slug),
        with: buildCourseWith(userId),
      })
      if (!course) throw new Error('Course not found')
      return parseCourse({
        ...course,
        lessons: course.lessons.map(lesson => ({
          ...lesson,
          assessment: lesson.assessments[0] ?? null,
        })),
      })
    })
  }
  return await fetchCourse(slug, userId)
}

export const listCourses = async ({ cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const isEditor = authUser?.role === 'admin' || authUser?.isEditor
  const userId = isEditor ? undefined : authUser?.id
  if (!useCache) {
    return await safeQuery(async () => {
      const result = await db.query.courses.findMany({ with: buildCourseWith(userId), limit: 200 })
      return result.map(course =>
        parseCourse({
          ...course,
          lessons: course.lessons.map(lesson => ({
            ...lesson,
            assessment: lesson.assessments[0] ?? null,
          })),
        })
      )
    })
  }
  return await fetchCourses(userId)
}

export const listSkillGroups = cache(async () => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)
  cacheLife('max')

  return await db.query.skillGroups.findMany({
    columns: { id: true, name: true },
    orderBy: skillGroups.name,
    limit: 100,
  })
})

const requireEditor = async () => {
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')
  if (user.role !== 'admin' && !user.isEditor) throw new Error('Not authorized')
  return user
}

export const checkSlugAvailable = async (slug: string, excludeId?: number) => {
  await requireEditor()

  const existing = await db.query.courses.findFirst({
    where: excludeId ? and(eq(courses.slug, slug), ne(courses.id, excludeId)) : eq(courses.slug, slug),
    columns: { id: true },
  })

  return !existing
}

export const createCourse = async (course: Omit<TableInsert<'courses'>, 'creatorId'>) => {
  const authUser = await requireEditor()

  const [created] = await db
    .insert(courses)
    .values({ ...course, creatorId: authUser.id })
    .returning()
  if (!created) return { error: { code: 'INSERT_FAILED', message: 'Failed to create course' } }

  const { data: lesson, error: lessonError } = await createLesson({
    courseId: created.id,
    sortOrder: 1,
    title: DEFAULT_LESSON.title,
    content: DEFAULT_LESSON.content,
  })
  if (lessonError) {
    await db.delete(courses).where(eq(courses.id, created.id))
    return { error: lessonError }
  }

  const full = await db.query.courses.findFirst({
    where: eq(courses.id, created.id),
    with: buildCourseWith(authUser.id),
  })
  if (!full) return { error: { code: 'NOT_FOUND', message: 'Course not found after creation' } }

  return {
    data: {
      ...parseCourse({
        ...full,
        lessons: full.lessons.map(l => ({ ...l, assessment: l.assessments[0] ?? null })),
      }),
      lessons: [lesson],
    },
  }
}

export const updateCourse = async (id: number, course: TableUpdate<'courses'>) => {
  const authUser = await requireEditor()
  await db.update(courses).set(course).where(eq(courses.id, id))

  const updated = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    with: buildCourseWith(authUser?.id),
  })
  if (!updated) return { error: { code: 'NOT_FOUND', message: 'Course not found' } }

  return {
    data: parseCourse({
      ...updated,
      lessons: updated.lessons.map(l => ({ ...l, assessment: l.assessments[0] ?? null })),
    }),
  }
}

export const deleteCourse = async (id: number) => {
  try {
    await requireEditor()
    await db.delete(courses).where(eq(courses.id, id))
    return { data: true, error: null }
  } catch (e) {
    return {
      data: null,
      error: { code: 'DELETE_FAILED', message: e instanceof Error ? e.message : 'Failed to delete course' },
    }
  }
}

export const createLesson = async (lesson: TableInsert<'lessons'>) => {
  await requireEditor()
  const [created] = await db.insert(lessons).values(lesson).returning()
  if (!created) return { error: { code: 'INSERT_FAILED', message: 'Failed to create lesson' } }

  return { data: parseLesson(created) }
}

export const upsertLessons = async (values: TableInsert<'lessons'>[]) => {
  await requireEditor()
  const result = await db
    .insert(lessons)
    .values(values)
    .onConflictDoUpdate({
      target: lessons.id,
      set: {
        title: values[0]?.title,
        content: values[0]?.content,
        sortOrder: values[0]?.sortOrder,
      },
    })
    .returning()

  return { data: result.map(parseLesson) }
}

export const reorderCourses = async (items: Course[]) => {
  await requireEditor()
  for (const [i, { id }] of items.entries()) {
    await db
      .update(courses)
      .set({ sortOrder: i + 1 })
      .where(eq(courses.id, id))
  }

  return { data: true }
}

export const upsertQuestions = async (values: TableInsert<'questions'>[]) => {
  await requireEditor()
  const result = await db
    .insert(questions)
    .values(values)
    .onConflictDoUpdate({
      target: questions.id,
      set: {
        description: values[0]?.description,
        explanation: values[0]?.explanation,
      },
    })
    .returning({ id: questions.id, description: questions.description, explanation: questions.explanation })

  return { data: result }
}

export const deleteQuestions = async (ids: number[]) => {
  await requireEditor()
  await db.delete(questions).where(inArray(questions.id, ids))
  return { data: true }
}

export const upsertEvaluations = async (values: TableInsert<'evaluations'>[]) => {
  await requireEditor()
  const result = await db
    .insert(evaluations)
    .values(values)
    .onConflictDoUpdate({
      target: evaluations.id,
      set: {
        description: values[0]?.description,
      },
    })
    .returning({ id: evaluations.id, description: evaluations.description })

  return { data: result }
}

export const deleteEvaluations = async (ids: number[]) => {
  await requireEditor()
  await db.delete(evaluations).where(inArray(evaluations.id, ids))
  return { data: true }
}

export const upsertAssessment = async (assessment: TableInsert<'assessments'>) => {
  await requireEditor()
  const [result] = await db
    .insert(assessments)
    .values(assessment)
    .onConflictDoUpdate({
      target: assessments.id,
      set: { description: assessment.description },
    })
    .returning({ id: assessments.id, description: assessments.description })
  if (!result) return { error: { code: 'INSERT_FAILED', message: 'Failed to upsert assessment' } }

  return { data: result }
}

export const deleteAssessment = async (id: number) => {
  await requireEditor()
  await db.delete(assessments).where(eq(assessments.id, id))
  return { data: true }
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
