import 'server-only'

import { cacheTag } from 'next/cache'
import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { getSessionUser } from '@/actions/session'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseCourse } from '@/db/queries/course'
import { publicUserColumns, userWith } from '@/db/queries/user'
import { userAnswers, userAssessments, userCourses, userEvaluations, userLessons } from '@/db/schema'
import { CacheTag, progressUserTag } from '@/lib/cache'

const courseWith = {
  skillGroup: { columns: { id: true, name: true } },
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
      assessments: { with: { userAssessments: { columns: { id: true, value: true } } } },
      userLessons: { columns: { id: true } },
    },
  },
  userCourses: { columns: { id: true } },
} as const

export const buildCourseWith = (userId?: string) => {
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

export const fetchCourses = cache(async (userId?: string) => {
  'use cache'
  cacheTag(CacheTag.Courses, ...(userId ? [progressUserTag(userId)] : []))

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

export const listSessionCourses = async () => {
  const user = await getSessionUser()
  const isEditor = user?.role === 'admin' || user?.isEditor
  return await fetchCourses(isEditor ? undefined : user?.id)
}
