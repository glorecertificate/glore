import 'server-only'

import { cacheTag } from 'next/cache'
import { cache } from 'react'

import { avg, count, eq } from 'drizzle-orm'

import { getSessionUser } from '@/actions/session'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseCourse, summarizeCourse } from '@/db/queries/course'
import { publicUserColumns, userWith } from '@/db/queries/user'
import { courseRatings, userAnswers, userAssessments, userCourses, userEvaluations, userLessons } from '@/db/schema'
import { CacheTag, progressUserTag } from '@/lib/cache'

const courseWith = {
  skillGroup: { columns: { id: true, name: true, slug: true } },
  creator: { columns: publicUserColumns, with: userWith },
  archivedBy: { columns: publicUserColumns, with: userWith },
  lessons: {
    with: {
      contributions: {
        with: {
          user: {
            columns: publicUserColumns,
            with: {
              memberships: {
                with: {
                  organization: {
                    columns: { id: true, name: true },
                    with: { profile: { columns: { avatarUrl: true } } },
                  },
                },
              },
              regions: { columns: { id: true, name: true, icon: true } },
            },
          },
        },
      },
      questions: { with: { options: { with: { userAnswers: { columns: { id: true } } } } } },
      evaluations: { with: { userEvaluations: { columns: { id: true, value: true } } } },
      assessments: { with: { userAssessments: { columns: { id: true } } } },
      userLessons: { columns: { id: true } },
    },
  },
  userCourses: { columns: { id: true } },
} as const

export const buildCourseWith = (userId?: string, { catalog = false }: { catalog?: boolean } = {}) => {
  const lessonColumns = catalog ? { columns: { content: false } } : {}
  const optionColumns = catalog ? { columns: { isCorrect: false } } : {}
  const levels = catalog ? {} : { levelDescriptions: true }
  if (!userId) {
    return {
      ...courseWith,
      lessons: {
        ...lessonColumns,
        with: {
          ...courseWith.lessons.with,
          questions: { with: { options: { ...optionColumns, with: { userAnswers: { columns: { id: true } } } } } },
          assessments: { with: { ...courseWith.lessons.with.assessments.with, ...levels } },
        },
      },
    } as unknown as typeof courseWith
  }
  return {
    ...courseWith,
    lessons: {
      ...lessonColumns,
      with: {
        ...courseWith.lessons.with,
        questions: {
          with: {
            options: {
              ...optionColumns,
              with: { userAnswers: { where: eq(userAnswers.userId, userId), columns: { id: true } } },
            },
          },
        },
        evaluations: {
          with: { userEvaluations: { where: eq(userEvaluations.userId, userId), columns: { id: true, value: true } } },
        },
        assessments: {
          with: {
            ...levels,
            userAssessments: { where: eq(userAssessments.userId, userId), columns: { id: true } },
          },
        },
        userLessons: { where: eq(userLessons.userId, userId), columns: { id: true } },
      },
    },
    userCourses: { where: eq(userCourses.userId, userId), columns: { id: true } },
  } as unknown as typeof courseWith
}

const fetchRatingSummaries = async () => {
  const rows = await db
    .select({ average: avg(courseRatings.rating), count: count(), courseId: courseRatings.courseId })
    .from(courseRatings)
    .groupBy(courseRatings.courseId)
  return new Map(
    rows.map(({ average, count: total, courseId }) => [
      courseId,
      { average: average === null ? null : Math.round(Number(average) * 10) / 10, count: total },
    ])
  )
}

export const queryCatalog = async (userId?: string) => {
  const [rows, ratings] = await Promise.all([
    db.query.courses.findMany({ with: buildCourseWith(userId, { catalog: true }) }),
    fetchRatingSummaries(),
  ])
  return rows.map(course =>
    parseCourse({
      ...course,
      lessons: course.lessons.map(lesson => ({
        ...lesson,
        assessment: lesson.assessments[0] ?? null,
      })),
      rating: ratings.get(course.id),
    })
  )
}

export const fetchCourses = cache(async (userId?: string) => {
  'use cache'
  cacheTag(CacheTag.Courses, ...(userId ? [progressUserTag(userId)] : []))

  return await safeQuery(() => queryCatalog(userId))
})

const buildSummaryWith = (userId?: string) => {
  const { lessons, ...rest } = buildCourseWith(userId, { catalog: true })
  return {
    ...rest,
    lessons: {
      columns: { id: true },
      with: { contributions: lessons.with.contributions, userLessons: lessons.with.userLessons },
    },
  } as unknown as typeof courseWith
}

export const queryCourseSummaries = async (userId: string | undefined, editor: boolean) => {
  const [rows, ratings] = await Promise.all([
    db.query.courses.findMany({ with: buildSummaryWith(userId) }),
    fetchRatingSummaries(),
  ])
  return rows.map(course => summarizeCourse(parseCourse({ ...course, rating: ratings.get(course.id) }), { editor }))
}

export const fetchCourseSummaries = cache(async (userId: string | undefined, editor: boolean) => {
  'use cache'
  cacheTag(CacheTag.Courses, ...(userId ? [progressUserTag(userId)] : []))

  return await safeQuery(() => queryCourseSummaries(userId, editor))
})

export const listSessionCourseSummaries = async () => {
  const user = await getSessionUser()
  const isEditor = user?.role === 'admin' || user?.isEditor
  return await fetchCourseSummaries(isEditor ? undefined : user?.id, Boolean(isEditor))
}
