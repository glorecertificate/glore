'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { and, eq, inArray, isNull, max, ne } from 'drizzle-orm'

import { buildCourseWith } from '@/actions/courses/helpers'
import { requireEditor } from '@/actions/guards'
import { db, transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import {
  deleteAssessments as deleteAssessmentRecords,
  deleteCourse as deleteCourseRecord,
  deleteEvaluations as deleteEvaluationRecords,
  deleteLessons as deleteLessonRecords,
  deleteQuestionOptions as deleteQuestionOptionRecords,
  deleteQuestions as deleteQuestionRecords,
} from '@/db/mutations/course'
import { languageChanges } from '@/db/queries/content-translation'
import { type Course, parseCourse } from '@/db/queries/course'
import { isReservedSlug, sanitizeDuration, sanitizeOutcomes } from '@/db/queries/course-editing'
import { DEFAULT_LESSON, parseLesson } from '@/db/queries/lesson'
import { assessments, courses, evaluations, lessons, questionOptions, questions } from '@/db/schema'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag, courseTag } from '@/lib/cache'
import { isTempId, omit } from '@/lib/utils'

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

const sanitizeDetails = <T extends TableUpdate<'courses'>>(values: T): T => ({
  ...values,
  ...('durationMinutes' in values ? { durationMinutes: sanitizeDuration(values.durationMinutes) } : {}),
  ...('outcomes' in values ? { outcomes: sanitizeOutcomes(values.outcomes) } : {}),
})

const revalidateCourseSlugs = (slugs: string[]) => {
  for (const slug of new Set(slugs)) updateTag(courseTag(slug))
  updateTag(CacheTag.Courses)
}

const persistedIds = (ids: number[]) => [...new Set(ids)].filter(id => !isTempId(id))

const slugsByCourseIds = async (courseIds: number[]) => {
  const ids = persistedIds(courseIds)
  if (ids.length === 0) return []
  const rows = await db.query.courses.findMany({ where: inArray(courses.id, ids), columns: { slug: true } })
  return rows.map(({ slug }) => slug)
}

const slugsByLessonIds = async (lessonIds: number[]) => {
  const ids = persistedIds(lessonIds)
  if (ids.length === 0) return []
  const rows = await db
    .select({ slug: courses.slug })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(inArray(lessons.id, ids))
  return rows.map(({ slug }) => slug)
}

const slugsByQuestionIds = async (questionIds: number[]) => {
  const ids = persistedIds(questionIds)
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
  const ids = persistedIds(optionIds)
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
  const ids = persistedIds(evaluationIds)
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
  const ids = persistedIds(assessmentIds)
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
  if (isReservedSlug(slug)) return false
  await requireEditor()

  const existing = await db.query.courses.findFirst({
    where: excludeId ? and(eq(courses.slug, slug), ne(courses.id, excludeId)) : eq(courses.slug, slug),
    columns: { id: true },
  })

  return !existing
}

export const createCourse = async (course: Omit<TableInsert<'courses'>, 'creatorId'>) => {
  if (isReservedSlug(course.slug)) return { error: { code: 'CONFLICT', message: 'Slug is reserved' } }
  const [authUser, sortOrder] = await Promise.all([requireEditor(), nextActiveSortOrder()])

  const values = sanitizeDetails(
    omit(course as TableInsert<'courses'> & { id?: number }, ['archivedAt', 'archivedById', 'creatorId', 'id'])
  )
  const { created, lesson } = await transaction(async tx => {
    const [createdCourse] = await tx
      .insert(courses)
      .values({ ...values, creatorId: authUser.id, sortOrder })
      .returning()
    if (!createdCourse) throw new Error('Failed to create course')

    const [createdLesson] = await tx
      .insert(lessons)
      .values({
        courseId: createdCourse.id,
        sortOrder: 1,
        title: DEFAULT_LESSON.title,
        content: DEFAULT_LESSON.content,
      })
      .returning()
    if (!createdLesson) throw new Error('Failed to create lesson')

    return { created: createdCourse, lesson: parseLesson(createdLesson) }
  })

  updateTag(CacheTag.Courses)

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
  if (course.slug && isReservedSlug(course.slug)) return { error: { code: 'CONFLICT', message: 'Slug is reserved' } }
  const authUser = await requireEditor()

  const values = await resolveCourseUpdate(
    authUser.id,
    sanitizeDetails(
      omit(course as TableUpdate<'courses'> & { id?: number }, ['archivedById', 'createdAt', 'creatorId', 'id'])
    )
  )

  const previous = values.languages
    ? await db.query.courses.findFirst({ columns: { languages: true, slug: true }, where: eq(courses.id, id) })
    : null
  const changes = languageChanges(previous?.languages, values.languages ?? [])

  await transaction(async tx => {
    await tx.update(courses).set(values).where(eq(courses.id, id))
    await mapSequential(changes, ({ locale, published }) =>
      recordEvent(tx, {
        actorId: authUser.id,
        data: { entityId: id, entityType: 'course', locale, published, slug: values.slug ?? previous?.slug ?? '' },
        organizationId: null,
        type: 'course.locale_published',
      })
    )
  })

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

export const upsertLessons = async (values: Array<TableInsert<'lessons'> & { id?: number }>) => {
  await requireEditor()
  const result = await transaction(tx =>
    mapSequential(values, ({ id, ...set }) =>
      isTempId(id)
        ? tx.insert(lessons).values(set).returning()
        : tx
            .update(lessons)
            .set(set)
            .where(eq(lessons.id, id as number))
            .returning()
    )
  )

  revalidateCourseSlugs(await slugsByCourseIds(values.map(({ courseId }) => courseId)))

  return { data: result.map(rows => (rows[0] ? parseLesson(rows[0]) : null)) }
}

export const deleteLessons = async (rawIds: number[]) => {
  const ids = persistedIds(rawIds)
  if (ids.length === 0) return { data: true }
  const [, slugs] = await Promise.all([requireEditor(), slugsByLessonIds(ids)])
  await transaction(tx => deleteLessonRecords(tx, ids))
  revalidateCourseSlugs(slugs)
  return { data: true }
}

export const reorderCourses = async (items: Course[]) => {
  await requireEditor()
  await transaction(tx =>
    mapSequential(
      items.map(({ id }, i) => ({ id, sortOrder: i + 1 })),
      ({ id, sortOrder }) => tx.update(courses).set({ sortOrder }).where(eq(courses.id, id))
    )
  )
  revalidateCourseSlugs(items.map(({ slug }) => slug))
  return { data: true }
}

export const upsertQuestions = async (values: Array<TableInsert<'questions'> & { id?: number }>) => {
  await requireEditor()
  const result = await transaction(tx =>
    mapSequential(values, ({ id, ...set }) =>
      isTempId(id)
        ? tx
            .insert(questions)
            .values(set as TableInsert<'questions'>)
            .returning({ id: questions.id, description: questions.description, explanation: questions.explanation })
        : tx
            .update(questions)
            .set(set)
            .where(eq(questions.id, id as number))
            .returning({ id: questions.id, description: questions.description, explanation: questions.explanation })
    )
  )
  revalidateCourseSlugs(await slugsByLessonIds(values.map(({ lessonId }) => lessonId)))
  return { data: result.map(rows => rows[0] ?? null) }
}

export const deleteQuestions = async (rawIds: number[]) => {
  const ids = persistedIds(rawIds)
  if (ids.length === 0) return { data: true }
  const [, slugs] = await Promise.all([requireEditor(), slugsByQuestionIds(ids)])
  await transaction(tx => deleteQuestionRecords(tx, ids))
  revalidateCourseSlugs(slugs)
  return { data: true }
}

export const upsertQuestionOptions = async (values: Array<TableInsert<'question_options'> & { id?: number }>) => {
  await requireEditor()
  const result = await transaction(tx =>
    mapSequential(values, ({ id, ...set }) =>
      isTempId(id)
        ? tx
            .insert(questionOptions)
            .values(set as TableInsert<'question_options'>)
            .returning({ id: questionOptions.id })
        : tx
            .update(questionOptions)
            .set(set)
            .where(eq(questionOptions.id, id as number))
            .returning({ id: questionOptions.id })
    )
  )
  revalidateCourseSlugs(await slugsByQuestionIds(values.map(({ questionId }) => questionId)))
  return { data: result.map(rows => rows[0] ?? null) }
}

export const deleteQuestionOptions = async (rawIds: number[]) => {
  const ids = persistedIds(rawIds)
  if (ids.length === 0) return { data: true }
  const [, slugs] = await Promise.all([requireEditor(), slugsByOptionIds(ids)])
  await transaction(tx => deleteQuestionOptionRecords(tx, ids))
  revalidateCourseSlugs(slugs)
  return { data: true }
}

export const upsertEvaluations = async (values: Array<TableInsert<'evaluations'> & { id?: number }>) => {
  await requireEditor()
  const result = await transaction(tx =>
    mapSequential(values, ({ id, ...set }) =>
      isTempId(id)
        ? tx
            .insert(evaluations)
            .values(set as TableInsert<'evaluations'>)
            .returning({ id: evaluations.id, description: evaluations.description })
        : tx
            .update(evaluations)
            .set(set)
            .where(eq(evaluations.id, id as number))
            .returning({ id: evaluations.id, description: evaluations.description })
    )
  )
  revalidateCourseSlugs(await slugsByLessonIds(values.map(({ lessonId }) => lessonId)))
  return { data: result.map(rows => rows[0] ?? null) }
}

export const deleteEvaluations = async (rawIds: number[]) => {
  const ids = persistedIds(rawIds)
  if (ids.length === 0) return { data: true }
  const [, slugs] = await Promise.all([requireEditor(), slugsByEvaluationIds(ids)])
  await transaction(tx => deleteEvaluationRecords(tx, ids))
  revalidateCourseSlugs(slugs)
  return { data: true }
}

export const upsertAssessment = async ({ id, ...set }: TableInsert<'assessments'> & { id?: number }) => {
  await requireEditor()
  const results = await (isTempId(id)
    ? db
        .insert(assessments)
        .values(set as TableInsert<'assessments'>)
        .returning({ id: assessments.id, description: assessments.description })
    : db
        .update(assessments)
        .set(set)
        .where(eq(assessments.id, id as number))
        .returning({ id: assessments.id, description: assessments.description }))
  const assessment = results[0]
  if (!assessment) return { error: { code: 'INSERT_FAILED', message: 'Failed to upsert assessment' } }
  revalidateCourseSlugs(await slugsByLessonIds([set.lessonId]))
  return { data: assessment }
}

export const deleteAssessment = async (id: number) => {
  if (isTempId(id)) return { data: true }
  const [, slugs] = await Promise.all([requireEditor(), slugsByAssessmentIds([id])])
  await transaction(tx => deleteAssessmentRecords(tx, [id]))
  revalidateCourseSlugs(slugs)
  return { data: true }
}
