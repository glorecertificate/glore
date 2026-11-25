#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { parseArgs } from 'node:util'

import { Pool, type PoolClient, type QueryResultRow } from 'pg'

import { DEFAULT_LOCALE, LOCALES, type Localized } from './config.mts'
import { type LoadedContent } from './load.mts'
import { SKILL_LEVELS } from './schema.mts'
import { guardTarget } from './target.mts'
import { checkContent, formatProblems } from './validate.mts'

export interface LevelsStats {
  created: number
  missing: string[]
  unchanged: number
}

interface LevelsCourse {
  lesson: number
  levels: Record<(typeof SKILL_LEVELS)[number], Localized>
  slug: string
}

type Field = [table: string, id: number, column: string, value: unknown]

const USAGE = 'Usage: pnpm run content:levels --target <local|qa|staging|production> [--dry-run]'

const sourceText = (value: unknown) =>
  value && typeof value === 'object' ? ((value as Record<string, unknown>)[DEFAULT_LOCALE] ?? null) : null

export const lessonSourceHash = async (client: PoolClient, lessonId: number) => {
  const query = async <T extends QueryResultRow>(text: string) => (await client.query<T>(text, [lessonId])).rows
  const [lesson] = await query<{ content: unknown; id: number; title: unknown }>(
    'select id, title, content from lessons where id = $1'
  )
  if (!lesson) return null
  const fields: Field[] = [
    ['lessons', lesson.id, 'title', sourceText(lesson.title)],
    ['lessons', lesson.id, 'content', sourceText(lesson.content)],
  ]
  const questions = await query<{ description: unknown; explanation: unknown; id: number }>(
    'select id, description, explanation from questions where lesson_id = $1 order by id'
  )
  for (const question of questions) {
    fields.push(
      ['questions', question.id, 'description', sourceText(question.description)],
      ['questions', question.id, 'explanation', sourceText(question.explanation)]
    )
    const options = await client.query<{ content: unknown; id: number }>(
      'select id, content from question_options where question_id = $1 order by id',
      [question.id]
    )
    for (const option of options.rows) {
      fields.push(['question_options', option.id, 'content', sourceText(option.content)])
    }
  }
  for (const evaluation of await query<{ description: unknown; id: number }>(
    'select id, description from evaluations where lesson_id = $1 order by id'
  )) {
    fields.push(['evaluations', evaluation.id, 'description', sourceText(evaluation.description)])
  }
  for (const assessment of await query<{ description: unknown; id: number }>(
    'select id, description from assessments where lesson_id = $1 order by id'
  )) {
    fields.push(['assessments', assessment.id, 'description', sourceText(assessment.description)])
    const levels = await client.query<{ description: unknown; id: number }>(
      'select id, description from skill_level_descriptions where assessment_id = $1 order by id',
      [assessment.id]
    )
    for (const level of levels.rows) {
      fields.push(['skill_level_descriptions', level.id, 'description', sourceText(level.description)])
    }
  }
  return createHash('sha256').update(JSON.stringify(fields)).digest('hex')
}

export const levelCourses = (content: LoadedContent): LevelsCourse[] =>
  content.courses.flatMap(course => {
    const last = course.lessons.at(-1)
    if (course.example || course.meta?.type !== 'skill' || !last) return []
    const files = LOCALES.map(locale => [locale, last.files[locale]?.levels] as const)
    if (files.some(([, levels]) => !levels)) return []
    const levels = Object.fromEntries(
      SKILL_LEVELS.map(level => [
        level,
        Object.fromEntries(files.map(([locale, texts]) => [locale, texts?.[level] ?? ''])) as Localized,
      ])
    ) as LevelsCourse['levels']
    return [{ lesson: last.number, levels, slug: course.meta.slug }]
  })

export const syncLevelDescriptions = async (client: PoolClient, courses: LevelsCourse[]): Promise<LevelsStats> => {
  const stats: LevelsStats = { created: 0, missing: [], unchanged: 0 }
  const targets = LOCALES.filter(locale => locale !== DEFAULT_LOCALE)

  for (const course of courses) {
    const { rows } = await client.query<{ assessmentId: number; lessonId: number }>(
      `select a.id as "assessmentId", l.id as "lessonId"
       from courses c
       join lessons l on l.course_id = c.id and l.sort_order = $2
       join assessments a on a.lesson_id = l.id
       where c.slug = $1 and c.type = 'skill'
       order by a.id limit 1`,
      [course.slug, course.lesson]
    )
    const found = rows[0]
    if (!found) {
      stats.missing.push(course.slug)
      continue
    }
    let created = 0
    for (const level of SKILL_LEVELS) {
      const inserted = await client.query(
        `insert into skill_level_descriptions (assessment_id, level, description)
         values ($1, $2::skill_level, $3::jsonb)
         on conflict (assessment_id, level) do nothing
         returning id`,
        [found.assessmentId, level, JSON.stringify(course.levels[level])]
      )
      created += inserted.rowCount ?? 0
    }
    stats.created += created
    stats.unchanged += SKILL_LEVELS.length - created
    if (created === 0) continue
    const hash = await lessonSourceHash(client, found.lessonId)
    for (const locale of targets) {
      await client.query(
        `insert into content_translations (entity_type, entity_id, locale, status, source_hash)
         values ('lesson', $1, $2, 'machine', $3)
         on conflict (entity_type, entity_id, locale)
         do update set status = 'machine', source_hash = excluded.source_hash, reviewed_by_id = null, updated_at = now()`,
        [found.lessonId, locale, hash]
      )
    }
  }
  return stats
}

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const importLevels = async () => {
  let values: { 'dry-run'?: boolean; target?: string }
  try {
    values = parseArgs({
      args: process.argv.slice(2),
      options: { 'dry-run': { type: 'boolean' }, target: { type: 'string' } },
      strict: true,
    }).values
  } catch (e) {
    return fail(`${(e as Error).message}\n${USAGE}`)
  }
  const target = ['local', 'qa', 'staging', 'production'].find(name => name === values.target) as
    | 'local'
    | 'production'
    | 'qa'
    | 'staging'
    | undefined
  if (!target) return fail(`--target must be one of local, qa, staging, production\n${USAGE}`)

  const guard = guardTarget(
    { bootstrap: false, drafts: false, dryRun: false, examples: false, remove: [], target },
    process.env.DATABASE_URL
  )
  if (guard.error) return fail(guard.error)

  const { content, problems } = checkContent()
  if (problems.length > 0) {
    return fail(`${formatProblems(problems)}\n\nFix ${problems.length} problem(s) before importing.`)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  let stats: LevelsStats
  try {
    await client.query('begin')
    stats = await syncLevelDescriptions(client, levelCourses(content))
    await client.query(values['dry-run'] ? 'rollback' : 'commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
    await pool.end()
  }

  console.info(values['dry-run'] ? 'Dry run: nothing was written.' : `Imported level descriptions into ${target}.`)
  console.info(`created ${stats.created}, unchanged ${stats.unchanged}`)
  if (stats.missing.length > 0) console.info(`Skill courses not in the database: ${stats.missing.join(', ')}`)
}

if (import.meta.main) await importLevels()
