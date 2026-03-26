import 'server-only'

import { eq } from 'drizzle-orm'

import { userAnswers, userAssessments, userCourses, userEvaluations, userLessons } from '@/db/schema'

export const courseWith = {
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
