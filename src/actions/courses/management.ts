'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { and, eq, inArray, isNull, max, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { buildCourseWith } from '@/actions/courses/helpers'
import { db } from '@/db/client'
import { parseCourse } from '@/db/queries/course'
import { type Course } from '@/db/queries/course'
import { DEFAULT_LESSON, parseLesson } from '@/db/queries/lesson'
import { assessments, courses, evaluations, lessons, questionOptions, questions } from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag, courseTag } from '@/lib/cache'

const requireEditor = async () => {
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')
  if (user.role !== 'admin' && !user.isEditor) throw new Error('Not authorized')
  return user
}

const nextActiveSortOrder = async () => {
  const result = await db
    .select({ value: max(courses.sortOrder) })
    .from(courses)
    .where(isNull(courses.archivedAt))
  return (result[0]?.value ?? 0) + 1
}

const resolveCourseUpdate = async (
  authUserId: string,
  course: TableUpdate<'courses'>
): Promise<TableUpdate<'courses'>> => {
  if (!('archivedAt' in course)) return course
  if (course.archivedAt) return { ...course, archivedById: authUserId, languages: [], sortOrder: null }
  return { ...course, archivedById: null, sortOrder: await nextActiveSortOrder() }
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
  const [authUser, sortOrder] = await Promise.all([requireEditor(), nextActiveSortOrder()])

  const values = await db
    .insert(courses)
    .values({ ...course, creatorId: authUser.id, sortOrder })
    .returning()
  const created = values[0]
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

  const values = await resolveCourseUpdate(authUser.id, course)

  await db.update(courses).set(values).where(eq(courses.id, id))

  const updated = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    with: buildCourseWith(authUser?.id),
  })
  if (!updated) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: 'Course not found',
      },
    }
  }

  revalidateTag(courseTag(updated.slug), 'max')
  revalidateTag(CacheTag.Courses, 'max')

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

const createLesson = async (lesson: TableInsert<'lessons'>) => {
  await requireEditor()
  const values = await db.insert(lessons).values(lesson).returning()
  const created = values[0]
  if (!created) return { error: { code: 'INSERT_FAILED', message: 'Failed to create lesson' } }

  return { data: parseLesson(created) }
}

export const upsertLessons = async (values: Array<TableInsert<'lessons'> & { id?: number }>) => {
  await requireEditor()
  const result = await Promise.all(
    values.reduce<Promise<(typeof lessons.$inferSelect)[]>[]>((promises, { id, ...set }) => {
      const promise = id
        ? db.update(lessons).set(set).where(eq(lessons.id, id)).returning()
        : db.insert(lessons).values(set).returning()
      return [...promises, promise]
    }, [])
  )
  return { data: result.flat().map(parseLesson) }
}

export const reorderCourses = async (items: Course[]) => {
  await requireEditor()
  await Promise.all(
    items.map(({ id }, i) =>
      db
        .update(courses)
        .set({ sortOrder: i + 1 })
        .where(eq(courses.id, id))
    )
  )
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

export const upsertQuestionOptions = async (values: Array<TableInsert<'question_options'> & { id?: number }>) => {
  await requireEditor()
  const result = await Promise.all(
    values.map(({ id, ...set }) =>
      id
        ? db.update(questionOptions).set(set).where(eq(questionOptions.id, id)).returning({ id: questionOptions.id })
        : db
            .insert(questionOptions)
            .values(set as TableInsert<'question_options'>)
            .returning({ id: questionOptions.id })
    )
  )
  return { data: result.flat() }
}

export const deleteQuestionOptions = async (ids: number[]) => {
  await requireEditor()
  await db.delete(questionOptions).where(inArray(questionOptions.id, ids))
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
  const results = await db
    .insert(assessments)
    .values(assessment)
    .onConflictDoUpdate({
      target: assessments.id,
      set: { description: assessment.description },
    })
    .returning({ id: assessments.id, description: assessments.description })
  if (!results[0]) return { error: { code: 'INSERT_FAILED', message: 'Failed to upsert assessment' } }
  return { data: results[0] }
}

export const deleteAssessment = async (id: number) => {
  await requireEditor()
  await db.delete(assessments).where(eq(assessments.id, id))
  return { data: true }
}
