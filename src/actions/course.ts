'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache } from 'react'

import { and, eq, inArray } from 'drizzle-orm'

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
import { CacheTag } from '@/lib/cache'

const courseWith = {
  skillGroup: { columns: { id: true, name: true } },
  creator: {
    with: {
      memberships: { with: { organization: true } },
      regions: { columns: { id: true, name: true, icon: true } },
    },
  },
  lessons: {
    with: {
      contributions: {
        with: {
          user: {
            with: {
              memberships: { with: { organization: true } },
              regions: { columns: { id: true, name: true, icon: true } },
            },
          },
        },
      },
      questions: { with: { options: { with: { userAnswers: true } } } },
      evaluations: { with: { userEvaluations: true } },
      assessments: { with: { userAssessments: true } },
      userLessons: true,
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
        questions: { with: { options: { with: { userAnswers: { where: eq(userAnswers.userId, userId) } } } } },
        evaluations: { with: { userEvaluations: { where: eq(userEvaluations.userId, userId) } } },
        assessments: { with: { userAssessments: { where: eq(userAssessments.userId, userId) } } },
        userLessons: { where: eq(userLessons.userId, userId) },
      },
    },
    userCourses: { where: eq(userCourses.userId, userId), columns: { id: true } },
  } as unknown as typeof courseWith
}

const fetchCourse = cache(async (slug: string, userId?: string) => {
  'use cache'
  cacheTag(`${CacheTag.Course}-${slug}`)

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
    const result = await db.query.courses.findMany({ with: buildCourseWith(userId) })
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

export const getCourse = async (slug: string, { cache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const userId = authUser?.id
  if (!cache) {
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

export const listCourses = async ({ cache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const userId = authUser?.id
  if (!cache) {
    return await safeQuery(async () => {
      const result = await db.query.courses.findMany({ with: buildCourseWith(userId) })
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
  })
})

export const createCourse = async (course: Omit<TableInsert<'courses'>, 'creatorId'>) => {
  const authUser = await getAuthUser()
  if (!authUser) throw new Error('Not authenticated')

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

  revalidateTag(CacheTag.Courses, 'max')

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
  const authUser = await getAuthUser()
  await db.update(courses).set(course).where(eq(courses.id, id))

  revalidateTag(CacheTag.Courses, 'max')

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
    await db.delete(courses).where(eq(courses.id, id))
    revalidateTag(CacheTag.Courses, 'max')
    return { data: true, error: null }
  } catch (e) {
    return {
      data: null,
      error: { code: 'DELETE_FAILED', message: e instanceof Error ? e.message : 'Failed to delete course' },
    }
  }
}

export const createLesson = async (lesson: TableInsert<'lessons'>) => {
  const [created] = await db.insert(lessons).values(lesson).returning()
  if (!created) return { error: { code: 'INSERT_FAILED', message: 'Failed to create lesson' } }

  return { data: parseLesson(created) }
}

export const upsertLessons = async (values: TableInsert<'lessons'>[]) => {
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
  for (const [i, { id }] of items.entries()) {
    await db
      .update(courses)
      .set({ sortOrder: i + 1 })
      .where(eq(courses.id, id))
  }

  return { data: true }
}

export const upsertQuestions = async (values: TableInsert<'questions'>[]) => {
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
  await db.delete(questions).where(inArray(questions.id, ids))
  return { data: true }
}

export const upsertEvaluations = async (values: TableInsert<'evaluations'>[]) => {
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
  await db.delete(evaluations).where(inArray(evaluations.id, ids))
  return { data: true }
}

export const upsertAssessment = async (assessment: TableInsert<'assessments'>) => {
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

export const completeLesson = async (lessonId: number, courseSlug: string) => {
  const user = await getAuthUser()
  if (!user) return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const existing = await db.query.userLessons.findFirst({
    where: and(eq(userLessons.userId, user.id), eq(userLessons.lessonId, lessonId)),
  })
  if (existing) return { data: existing }

  const [result] = await db.insert(userLessons).values({ userId: user.id, lessonId }).returning()

  revalidateTag(`${CacheTag.Course}-${courseSlug}`, 'max')
  revalidateTag(CacheTag.Courses, 'max')

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

  return { data: result }
}
