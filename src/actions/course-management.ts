'use server'

import 'server-only'

import { and, eq, inArray, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { buildCourseWith } from '@/actions/course-queries'
import { db } from '@/db/client'
import { parseCourse } from '@/db/queries/course'
import { type Course } from '@/db/queries/course'
import { DEFAULT_LESSON, parseLesson } from '@/db/queries/lesson'
import { assessments, courses, evaluations, lessons, questions } from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'

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
