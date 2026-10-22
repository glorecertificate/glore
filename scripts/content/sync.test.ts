import { rmSync } from 'node:fs'

import { Pool, type PoolClient } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seedEmail } from '~/scripts/seed-data'

import { buildCatalog } from './catalog.mts'
import { LOCALES } from './config.mts'
import { FIXTURE_SLUG, createFixture, lessonText, questionYaml } from './fixture.ts'
import { loadContent } from './load.mts'
import { type SyncStats, createStats, removeCourse, syncCatalog } from './sync.mts'

const isLocalDatabase = /@(localhost|127\.0\.0\.1)(:|\/)/u.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('syncCatalog', () => {
  const fixture = createFixture()
  let pool: Pool
  let client: PoolClient
  let userId: string

  const sync = async (drafts = false) => {
    const { content, problems } = loadContent(fixture.root)
    expect(problems).toEqual([])
    const stats = createStats()
    await client.query('begin')
    try {
      Object.assign(stats, await syncCatalog(client, buildCatalog(content), { drafts, examples: false }))
      await client.query('commit')
    } catch (e) {
      await client.query('rollback')
      throw e
    }
    return stats
  }

  const counts = async () => {
    const { rows } = await client.query(
      `with c as (select id from courses where slug = $1),
         l as (select id from lessons where course_id in (select id from c)),
         q as (select id from questions where lesson_id in (select id from l))
       select
         (select count(*) from c)::int as courses,
         (select count(*) from l)::int as lessons,
         (select count(*) from q)::int as questions,
         (select count(*) from question_options where question_id in (select id from q))::int as question_options,
         (select count(*) from evaluations where lesson_id in (select id from l))::int as evaluations,
         (select count(*) from assessments where lesson_id in (select id from l))::int as assessments`,
      [FIXTURE_SLUG]
    )
    return rows[0]
  }

  const remove = async () => {
    await client.query('begin')
    await removeCourse({ client, stats: createStats() }, FIXTURE_SLUG)
    await client.query('commit')
  }

  const mutated = (stats: SyncStats) =>
    Object.values(stats).some(value => typeof value === 'object' && (value.created || value.updated || value.deleted))

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    client = await pool.connect()
    const { rows } = await client.query<{ id: string }>('select id from users where email = $1', [
      seedEmail('volunteer'),
    ])
    if (!rows[0]) throw new Error('Run pnpm run db:seed first')
    userId = rows[0].id
    await remove()
  })

  afterAll(async () => {
    await remove()
    client.release()
    await pool.end()
    rmSync(fixture.root, { force: true, recursive: true })
  })

  it('creates the course, then changes nothing on a second run', async () => {
    const first = await sync()
    const afterFirst = await counts()
    const second = await sync()

    expect(first.courses.created).toBe(1)
    expect(afterFirst).toEqual({
      assessments: 1,
      courses: 1,
      evaluations: 1,
      lessons: 2,
      question_options: 3,
      questions: 1,
    })
    expect(await counts()).toEqual(afterFirst)
    expect(mutated(second)).toBe(false)
    expect(second.lessons.unchanged).toBe(2)
  })

  it('sets languages, and drafts never unpublish', async () => {
    const languages = async () =>
      (await client.query<{ languages: string[] }>('select languages from courses where slug = $1', [FIXTURE_SLUG]))
        .rows[0].languages

    await sync()
    expect(await languages()).toEqual(LOCALES)
    await sync(true)
    expect(await languages()).toEqual(LOCALES)
    await remove()
    await sync(true)
    expect(await languages()).toEqual([])
  })

  it('keeps progress on unchanged content and clears it on changed answers', async () => {
    await sync()
    const { rows } = await client.query<{ id: number; is_correct: boolean }>(
      'select o.id, o.is_correct from question_options o join questions q on q.id = o.question_id join lessons l on l.id = q.lesson_id join courses c on c.id = l.course_id where c.slug = $1 order by o.id',
      [FIXTURE_SLUG]
    )
    const wrong = rows.find(option => !option.is_correct)
    if (!wrong) throw new Error('fixture has no wrong option')
    await client.query('delete from user_answers where user_id = $1 and option_id = $2', [userId, wrong.id])
    await client.query('insert into user_answers (user_id, option_id) values ($1, $2)', [userId, wrong.id])
    const answers = async () =>
      Number((await client.query('select count(*) from user_answers where option_id = $1', [wrong.id])).rows[0].count)

    await sync()
    expect(await answers()).toBe(1)

    for (const locale of LOCALES) {
      fixture.write(
        `${fixture.base}/lessons/1.${locale}.md`,
        lessonText(locale, questionYaml(0, 3), 'Read this first.')
      )
    }
    const stats = await sync()

    expect(stats.options.updated).toBe(2)
    expect(stats.progressRowsRemoved).toBe(1)
    expect(await answers()).toBe(0)
  })

  it('removes lessons that left the content, with their children', async () => {
    await sync()
    rmSync(`${fixture.root}/${fixture.base}/lessons`, { force: true, recursive: true })
    for (const locale of LOCALES) {
      fixture.write(`${fixture.base}/lessons/1.${locale}.md`, lessonText(locale, 'assessment: Rate.\n'))
    }

    const stats = await sync()

    expect(stats.lessons.deleted).toBe(1)
    expect(await counts()).toEqual({
      assessments: 1,
      courses: 1,
      evaluations: 0,
      lessons: 1,
      question_options: 0,
      questions: 0,
    })
  })

  it('removes a course completely', async () => {
    await sync()
    await remove()

    expect(await counts()).toEqual({
      assessments: 0,
      courses: 0,
      evaluations: 0,
      lessons: 0,
      question_options: 0,
      questions: 0,
    })
  })
})
