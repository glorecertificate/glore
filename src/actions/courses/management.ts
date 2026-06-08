'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { and, eq, inArray, isNull, max, ne } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { buildCourseWith } from '@/actions/courses/helpers'
import { db, transaction } from '@/db/client'
import { deleteCourse as deleteCourseRecord } from '@/db/mutations/course'
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

const revalidateCourseSlugs = (slugs: string[]) => {
  for (const slug of new Set(slugs)) updateTag(courseTag(slug))
  updateTag(CacheTag.Courses)
}

const slugsByCourseIds = async (courseIds: number[]) => {
  const ids = [...new Set(courseIds)]
  if (ids.length === 0) return []
  const rows = await db.query.courses.findMany({ where: inArray(courses.id, ids), columns: { slug: true } })
  return rows.map(({ slug }) => slug)
}

const slugsByLessonIds = async (lessonIds: number[]) => {
  const ids = [...new Set(lessonIds)]
  if (ids.length === 0) return []
  const rows = await db
    .select({ slug: courses.slug })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(inArray(lessons.id, ids))
  return rows.map(({ slug }) => slug)
}

const slugsByQuestionIds = async (questionIds: number[]) => {
  const ids = [...new Set(questionIds)]
  if (ids.length === 0) return []
  const rows = await db
    .select({ slug: courses.slug })
    .from(questions)
    .innerJoin(lessons, eq(lessons.id, questions.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(inArray(questions.id, ids))
  return rows.map(({ slug }) => slug)
}

const slugsByOptionIds = async (optionIds: number[]) => {
  const ids = [...new Set(optionIds)]
  if (ids.length === 0) return []
  const rows = await db
    .select({ slug: courses.slug })
    .from(questionOptions)
    .innerJoin(questions, eq(questions.id, questionOptions.questionId))
    .innerJoin(lessons, eq(lessons.id, questions.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(inArray(questionOptions.id, ids))
  return rows.map(({ slug }) => slug)
}

const slugsByEvaluationIds = async (evaluationIds: number[]) => {
  const ids = [...new Set(evaluationIds)]
  if (ids.length === 0) return []
  const rows = await db
    .select({ slug: courses.slug })
    .from(evaluations)
    .innerJoin(lessons, eq(lessons.id, evaluations.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(inArray(evaluations.id, ids))
  return rows.map(({ slug }) => slug)
}

const slugsByAssessmentIds = async (assessmentIds: number[]) => {
  const ids = [...new Set(assessmentIds)]
  if (ids.length === 0) return []
  const rows = await db
    .select({ slug: courses.slug })
    .from(assessments)
    .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(inArray(assessments.id, ids))
  return rows.map(({ slug }) => slug)
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

  updateTag(courseTag(updated.slug))
  updateTag(CacheTag.Courses)

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

    const course = await db.query.courses.findFirst({ where: eq(courses.id, id), columns: { slug: true } })
    if (!course) return { data: null, error: { code: 'NOT_FOUND', message: 'Course not found' } }

    await transaction(tx => deleteCourseRecord(tx, id))

    updateTag(courseTag(course.slug))
    updateTag(CacheTag.Courses)

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

  revalidateCourseSlugs(await slugsByCourseIds(values.map(({ courseId }) => courseId)))

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
  revalidateCourseSlugs(items.map(({ slug }) => slug))
  return { data: true }
}

export const upsertQuestions = async (values: Array<TableInsert<'questions'> & { id?: number }>) => {
  await requireEditor()
  const result = await Promise.all(
    values.map(({ id, ...set }) =>
      id
        ? db
            .update(questions)
            .set(set)
            .where(eq(questions.id, id))
            .returning({ id: questions.id, description: questions.description, explanation: questions.explanation })
        : db
            .insert(questions)
            .values(set as TableInsert<'questions'>)
            .returning({ id: questions.id, description: questions.description, explanation: questions.explanation })
    )
  )
  revalidateCourseSlugs(await slugsByLessonIds(values.map(({ lessonId }) => lessonId)))
  return { data: result.flat() }
}

export const deleteQuestions = async (ids: number[]) => {
  const [, slugs] = await Promise.all([requireEditor(), slugsByQuestionIds(ids)])
  await db.delete(questions).where(inArray(questions.id, ids))
  revalidateCourseSlugs(slugs)
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
  revalidateCourseSlugs(await slugsByQuestionIds(values.map(({ questionId }) => questionId)))
  return { data: result.flat() }
}

export const deleteQuestionOptions = async (ids: number[]) => {
  const [, slugs] = await Promise.all([requireEditor(), slugsByOptionIds(ids)])
  await db.delete(questionOptions).where(inArray(questionOptions.id, ids))
  revalidateCourseSlugs(slugs)
  return { data: true }
}

export const upsertEvaluations = async (values: Array<TableInsert<'evaluations'> & { id?: number }>) => {
  await requireEditor()
  const result = await Promise.all(
    values.map(({ id, ...set }) =>
      id
        ? db
            .update(evaluations)
            .set(set)
            .where(eq(evaluations.id, id))
            .returning({ id: evaluations.id, description: evaluations.description })
        : db
            .insert(evaluations)
            .values(set as TableInsert<'evaluations'>)
            .returning({ id: evaluations.id, description: evaluations.description })
    )
  )
  revalidateCourseSlugs(await slugsByLessonIds(values.map(({ lessonId }) => lessonId)))
  return { data: result.flat() }
}

export const deleteEvaluations = async (ids: number[]) => {
  const [, slugs] = await Promise.all([requireEditor(), slugsByEvaluationIds(ids)])
  await db.delete(evaluations).where(inArray(evaluations.id, ids))
  revalidateCourseSlugs(slugs)
  return { data: true }
}

export const upsertAssessment = async ({ id, ...set }: TableInsert<'assessments'> & { id?: number }) => {
  await requireEditor()
  const results = await (id
    ? db
        .update(assessments)
        .set(set)
        .where(eq(assessments.id, id))
        .returning({ id: assessments.id, description: assessments.description })
    : db
        .insert(assessments)
        .values(set as TableInsert<'assessments'>)
        .returning({ id: assessments.id, description: assessments.description }))
  if (!results[0]) return { error: { code: 'INSERT_FAILED', message: 'Failed to upsert assessment' } }
  revalidateCourseSlugs(await slugsByLessonIds([set.lessonId]))
  return { data: results[0] }
}

export const deleteAssessment = async (id: number) => {
  const [, slugs] = await Promise.all([requireEditor(), slugsByAssessmentIds([id])])
  await db.delete(assessments).where(eq(assessments.id, id))
  revalidateCourseSlugs(slugs)
  return { data: true }
}
