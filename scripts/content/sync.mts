import { type PoolClient } from 'pg'

import { type Catalog, type CatalogCourse, type CatalogLesson } from './catalog.mts'
import { LOCALES } from './config.mts'

export interface Counter {
  created: number
  updated: number
  unchanged: number
  deleted: number
}

export type Entity = 'groups' | 'courses' | 'lessons' | 'questions' | 'options' | 'evaluations' | 'assessments'

export type SyncStats = Record<Entity, Counter> & { progressRowsRemoved: number }

export interface SyncOptions {
  drafts: boolean
  examples: boolean
}

interface Row {
  id: number
  [column: string]: unknown
}

export interface Context {
  client: PoolClient
  stats: SyncStats
}

export const ENTITIES: Entity[] = ['groups', 'courses', 'lessons', 'questions', 'options', 'evaluations', 'assessments']

export const createStats = (): SyncStats => ({
  ...(Object.fromEntries(
    ENTITIES.map(entity => [entity, { created: 0, deleted: 0, unchanged: 0, updated: 0 }])
  ) as Record<Entity, Counter>),
  progressRowsRemoved: 0,
})

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortKeys(item)])
    )
  }
  return value
}

const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a ?? null)) === JSON.stringify(sortKeys(b ?? null))

const json = (value: unknown) => JSON.stringify(value)

const ids = (rows: Row[]) => rows.map(row => row.id)

const run = async (client: PoolClient, text: string, values: unknown[] = []) => await client.query<Row>(text, values)

const deleteProgress = async (ctx: Context, text: string, values: unknown[]) => {
  const { client, stats } = ctx
  const { rowCount } = await client.query(text, values)
  stats.progressRowsRemoved += rowCount ?? 0
}

const deleteOptions = async (ctx: Context, optionIds: number[]) => {
  const { client, stats } = ctx
  if (optionIds.length === 0) return
  await deleteProgress(ctx, 'delete from user_answers where option_id = any($1::int[])', [optionIds])
  await client.query('delete from question_options where id = any($1::int[])', [optionIds])
  stats.options.deleted += optionIds.length
}

const deleteQuestions = async (ctx: Context, questionIds: number[]) => {
  const { client, stats } = ctx
  if (questionIds.length === 0) return
  const options = await run(client, 'select id from question_options where question_id = any($1::int[])', [questionIds])
  await deleteOptions(ctx, ids(options.rows))
  await client.query('delete from questions where id = any($1::int[])', [questionIds])
  stats.questions.deleted += questionIds.length
}

const deleteEvaluations = async (ctx: Context, evaluationIds: number[]) => {
  const { client, stats } = ctx
  if (evaluationIds.length === 0) return
  await deleteProgress(ctx, 'delete from user_evaluations where evaluation_id = any($1::int[])', [evaluationIds])
  await client.query('delete from evaluations where id = any($1::int[])', [evaluationIds])
  stats.evaluations.deleted += evaluationIds.length
}

const deleteAssessments = async (ctx: Context, assessmentIds: number[]) => {
  const { client, stats } = ctx
  if (assessmentIds.length === 0) return
  await deleteProgress(ctx, 'delete from user_assessments where assessment_id = any($1::int[])', [assessmentIds])
  await client.query('delete from assessments where id = any($1::int[])', [assessmentIds])
  stats.assessments.deleted += assessmentIds.length
}

const deleteLessons = async (ctx: Context, lessonIds: number[]) => {
  const { client, stats } = ctx
  if (lessonIds.length === 0) return
  const questions = await run(client, 'select id from questions where lesson_id = any($1::int[])', [lessonIds])
  const evaluations = await run(client, 'select id from evaluations where lesson_id = any($1::int[])', [lessonIds])
  const assessments = await run(client, 'select id from assessments where lesson_id = any($1::int[])', [lessonIds])
  await deleteQuestions(ctx, ids(questions.rows))
  await deleteEvaluations(ctx, ids(evaluations.rows))
  await deleteAssessments(ctx, ids(assessments.rows))
  await deleteProgress(ctx, 'delete from user_lessons where lesson_id = any($1::int[])', [lessonIds])
  await client.query('delete from contributions where lesson_id = any($1::int[])', [lessonIds])
  await client.query('delete from lessons where id = any($1::int[])', [lessonIds])
  stats.lessons.deleted += lessonIds.length
}

const syncGroups = async (ctx: Context, catalog: Catalog) => {
  const { client, stats } = ctx
  const groupIds = new Map<string, number>()
  for (const group of catalog.groups) {
    const { rows } = await run(
      client,
      'select id, name, description, icon, sort_order from skill_groups where slug = $1',
      [group.slug]
    )
    const [existing] = rows
    if (!existing) {
      const created = await run(
        client,
        'insert into skill_groups (slug, name, description, icon, sort_order) values ($1, $2::jsonb, $3::jsonb, $4, $5) returning id',
        [group.slug, json(group.name), json(group.description), group.icon, group.sortOrder]
      )
      groupIds.set(group.slug, created.rows[0].id)
      stats.groups.created++
      continue
    }
    groupIds.set(group.slug, existing.id)
    const unchanged =
      same(existing.name, group.name) &&
      same(existing.description, group.description) &&
      existing.icon === group.icon &&
      existing.sort_order === group.sortOrder
    if (unchanged) {
      stats.groups.unchanged++
      continue
    }
    await client.query(
      'update skill_groups set name = $2::jsonb, description = $3::jsonb, icon = $4, sort_order = $5, updated_at = now() where id = $1',
      [existing.id, json(group.name), json(group.description), group.icon, group.sortOrder]
    )
    stats.groups.updated++
  }
  return groupIds
}

const syncCourse = async (
  { client, stats }: Context,
  course: CatalogCourse,
  { drafts, groupId }: { drafts: boolean; groupId: number | null }
) => {
  const { rows } = await run(
    client,
    'select id, type, title, description, icon, languages, duration_minutes, outcomes, skill_group_id, sort_order from courses where slug = $1',
    [course.slug]
  )
  const [existing] = rows
  const values = [
    course.type,
    json(course.title),
    json(course.description),
    course.icon,
    drafts ? ((existing?.languages as string[] | undefined) ?? []) : LOCALES,
    course.durationMinutes,
    json(course.outcomes),
    groupId,
    course.sortOrder,
  ]

  if (!existing) {
    const created = await run(
      client,
      `insert into courses (type, title, description, icon, languages, duration_minutes, outcomes, skill_group_id, sort_order, slug)
       values ($1::course_type, $2::jsonb, $3::jsonb, $4, $5::text[], $6, $7::jsonb, $8, $9, $10) returning id`,
      [...values, course.slug]
    )
    stats.courses.created++
    return created.rows[0].id
  }

  const unchanged =
    existing.type === course.type &&
    same(existing.title, course.title) &&
    same(existing.description, course.description) &&
    existing.icon === course.icon &&
    same(existing.languages, values[4]) &&
    existing.duration_minutes === course.durationMinutes &&
    same(existing.outcomes, course.outcomes) &&
    existing.skill_group_id === groupId &&
    existing.sort_order === course.sortOrder
  if (unchanged) {
    stats.courses.unchanged++
    return existing.id
  }
  await client.query(
    `update courses set type = $1::course_type, title = $2::jsonb, description = $3::jsonb, icon = $4, languages = $5::text[],
       duration_minutes = $6, outcomes = $7::jsonb, skill_group_id = $8, sort_order = $9, updated_at = now() where id = $10`,
    [...values, existing.id]
  )
  stats.courses.updated++
  return existing.id
}

const syncLessonRows = async (ctx: Context, courseId: number, lessons: CatalogLesson[]) => {
  const { client, stats } = ctx
  const { rows } = await run(
    client,
    'select id, title, content, sort_order from lessons where course_id = $1 order by sort_order, id',
    [courseId]
  )
  const keep = new Map<number, Row>()
  const surplus: number[] = []
  for (const row of rows) {
    const order = row.sort_order as number
    if (keep.has(order) || order > lessons.length || order < 1) surplus.push(row.id)
    else keep.set(order, row)
  }
  await deleteLessons(ctx, surplus)

  const lessonIds = new Map<number, number>()
  for (const lesson of lessons) {
    const existing = keep.get(lesson.number)
    if (!existing) {
      const created = await run(
        client,
        'insert into lessons (course_id, title, content, sort_order) values ($1, $2::jsonb, $3::jsonb, $4) returning id',
        [courseId, json(lesson.title), json(lesson.content), lesson.number]
      )
      lessonIds.set(lesson.number, created.rows[0].id)
      stats.lessons.created++
      continue
    }
    lessonIds.set(lesson.number, existing.id)
    if (same(existing.title, lesson.title) && same(existing.content, lesson.content)) {
      stats.lessons.unchanged++
      continue
    }
    await client.query('update lessons set title = $2::jsonb, content = $3::jsonb, updated_at = now() where id = $1', [
      existing.id,
      json(lesson.title),
      json(lesson.content),
    ])
    stats.lessons.updated++
  }
  return lessonIds
}

const syncQuestions = async (ctx: Context, lessonId: number, lesson: CatalogLesson) => {
  const { client, stats } = ctx
  const questions = await run(
    client,
    'select id, description, explanation from questions where lesson_id = $1 order by id',
    [lessonId]
  )
  const options = await run(
    client,
    'select id, question_id, content, is_correct from question_options where question_id = any($1::int[]) order by id',
    [ids(questions.rows)]
  )

  for (const [index, question] of lesson.questions.entries()) {
    const existing = questions.rows[index]
    let questionId = existing?.id
    if (existing) {
      if (same(existing.description, question.description) && same(existing.explanation, question.explanation)) {
        stats.questions.unchanged++
      } else {
        await client.query(
          'update questions set description = $2::jsonb, explanation = $3::jsonb, updated_at = now() where id = $1',
          [existing.id, json(question.description), json(question.explanation)]
        )
        stats.questions.updated++
        await deleteProgress(
          ctx,
          'delete from user_answers where option_id in (select id from question_options where question_id = $1)',
          [existing.id]
        )
      }
    } else {
      const created = await run(
        client,
        'insert into questions (lesson_id, description, explanation) values ($1, $2::jsonb, $3::jsonb) returning id',
        [lessonId, json(question.description), json(question.explanation)]
      )
      questionId = created.rows[0].id
      stats.questions.created++
    }

    const existingOptions = options.rows.filter(option => option.question_id === questionId)
    for (const [optionIndex, option] of question.options.entries()) {
      const current = existingOptions[optionIndex]
      if (!current) {
        await client.query(
          'insert into question_options (question_id, content, is_correct) values ($1, $2::jsonb, $3)',
          [questionId, json(option.content), option.isCorrect]
        )
        stats.options.created++
        continue
      }
      if (same(current.content, option.content) && current.is_correct === option.isCorrect) {
        stats.options.unchanged++
        continue
      }
      await client.query(
        'update question_options set content = $2::jsonb, is_correct = $3, updated_at = now() where id = $1',
        [current.id, json(option.content), option.isCorrect]
      )
      stats.options.updated++
      if (current.is_correct !== option.isCorrect) {
        await deleteProgress(ctx, 'delete from user_answers where option_id = $1', [current.id])
      }
    }
    await deleteOptions(ctx, ids(existingOptions.slice(question.options.length)))
  }
  await deleteQuestions(ctx, ids(questions.rows.slice(lesson.questions.length)))
}

const syncEvaluations = async (ctx: Context, lessonId: number, lesson: CatalogLesson) => {
  const { client, stats } = ctx
  const { rows } = await run(client, 'select id, description from evaluations where lesson_id = $1 order by id', [
    lessonId,
  ])
  for (const [index, evaluation] of lesson.evaluations.entries()) {
    const existing = rows[index]
    if (!existing) {
      await client.query('insert into evaluations (lesson_id, description) values ($1, $2::jsonb)', [
        lessonId,
        json(evaluation),
      ])
      stats.evaluations.created++
      continue
    }
    if (same(existing.description, evaluation)) {
      stats.evaluations.unchanged++
      continue
    }
    await client.query('update evaluations set description = $2::jsonb, updated_at = now() where id = $1', [
      existing.id,
      json(evaluation),
    ])
    await deleteProgress(ctx, 'delete from user_evaluations where evaluation_id = $1', [existing.id])
    stats.evaluations.updated++
  }
  await deleteEvaluations(ctx, ids(rows.slice(lesson.evaluations.length)))
}

const syncAssessment = async (ctx: Context, lessonId: number, lesson: CatalogLesson) => {
  const { client, stats } = ctx
  const { rows } = await run(client, 'select id, description from assessments where lesson_id = $1 order by id', [
    lessonId,
  ])
  const [existing, ...surplus] = rows
  await deleteAssessments(ctx, ids(surplus))

  if (!lesson.assessment) {
    if (existing) await deleteAssessments(ctx, [existing.id])
    return
  }
  if (!existing) {
    await client.query('insert into assessments (lesson_id, description) values ($1, $2::jsonb)', [
      lessonId,
      json(lesson.assessment),
    ])
    stats.assessments.created++
    return
  }
  if (same(existing.description, lesson.assessment)) {
    stats.assessments.unchanged++
    return
  }
  await client.query('update assessments set description = $2::jsonb, updated_at = now() where id = $1', [
    existing.id,
    json(lesson.assessment),
  ])
  await deleteProgress(ctx, 'delete from user_assessments where assessment_id = $1', [existing.id])
  stats.assessments.updated++
}

export const removeCourse = async (ctx: Context, slug: string) => {
  const { client, stats } = ctx
  const { rows } = await run(client, 'select id from courses where slug = $1', [slug])
  const [course] = rows
  if (!course) return false
  const certificates = await run(client, 'select id from certificate_skills where course_id = $1 limit 1', [course.id])
  if (certificates.rows.length > 0) throw new Error(`Cannot remove "${slug}": certificates reference it.`)
  const lessons = await run(client, 'select id from lessons where course_id = $1', [course.id])
  await deleteLessons(ctx, ids(lessons.rows))
  await deleteProgress(ctx, 'delete from user_courses where course_id = $1', [course.id])
  await client.query('delete from courses where id = $1', [course.id])
  stats.courses.deleted++
  return true
}

export const syncCatalog = async (client: PoolClient, catalog: Catalog, { drafts, examples }: SyncOptions) => {
  const stats = createStats()
  const ctx = { client, stats }
  const groupIds = await syncGroups(ctx, catalog)

  for (const course of catalog.courses) {
    if (course.example && !examples) continue
    const groupId = course.skillGroup ? (groupIds.get(course.skillGroup) ?? null) : null
    const courseId = await syncCourse(ctx, course, { drafts, groupId })
    const lessonIds = await syncLessonRows(ctx, courseId, course.lessons)
    for (const lesson of course.lessons) {
      const lessonId = lessonIds.get(lesson.number) as number
      await syncQuestions(ctx, lessonId, lesson)
      await syncEvaluations(ctx, lessonId, lesson)
      await syncAssessment(ctx, lessonId, lesson)
    }
  }
  return stats
}
