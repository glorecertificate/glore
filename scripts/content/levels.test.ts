import { Pool, type PoolClient } from 'pg'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from '@/actions/courses/learning.fixture'
import { sourceHashOf } from '@/db/mutations/content-translation'

import { lessonSourceHash, syncLevelDescriptions } from './levels.mts'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), updateTag: vi.fn() }))

const isLocalDatabase = /@(localhost|127\.0\.0\.1)(:|\/)/u.test(process.env.DATABASE_URL ?? '')

const text = (value: string) => ({ en: value, es: `${value} es`, it: `${value} it` })
const course = (slug: string, prefix: string) => ({
  lesson: 3,
  levels: {
    advanced: text(`${prefix} advanced`),
    good: text(`${prefix} good`),
    intermediate: text(`${prefix} intermediate`),
  },
  slug,
})

describe.skipIf(!isLocalDatabase)('syncLevelDescriptions', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let pool: Pool
  let client: PoolClient

  const descriptions = async () => {
    const { rows } = await client.query<{ description: Record<string, string>; id: number; level: string }>(
      'select id, level, description from skill_level_descriptions where assessment_id = $1 order by level',
      [fixture.assessmentId]
    )
    return rows
  }

  const translations = async () => {
    const { rows } = await client.query<{ locale: string; source_hash: string; status: string }>(
      `select locale, status, source_hash from content_translations where entity_type = 'lesson' and entity_id = $1 order by locale`,
      [fixture.lessonIds.assessment]
    )
    return rows
  }

  beforeAll(async () => {
    context = await loadContext('editor')
    fixture = await createFixtureCourse(context)
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    client = await pool.connect()
  })

  afterAll(async () => {
    await client.query(`delete from content_translations where entity_type = 'lesson' and entity_id = $1`, [
      fixture.lessonIds.assessment,
    ])
    client.release()
    await pool.end()
    await removeFixtureCourse(context, fixture)
  })

  it('inserts the missing descriptions and marks the lesson as machine translated with the app hash', async () => {
    const stats = await syncLevelDescriptions(client, [course(fixture.slug, 'first')])
    expect(stats).toMatchObject({ created: 3, unchanged: 0 })
    const rows = await translations()
    expect(rows.map(row => [row.locale, row.status])).toEqual([
      ['es', 'machine'],
      ['it', 'machine'],
    ])
    const { loadTargets } = await import('@/actions/translations/helpers')
    const [target] = await loadTargets('lesson', fixture.lessonIds.assessment)
    expect(target?.fields.some(field => field.table === 'skill_level_descriptions')).toBe(true)
    expect(rows[0]?.source_hash).toBe(sourceHashOf(target as NonNullable<typeof target>))
    expect(await lessonSourceHash(client, fixture.lessonIds.assessment)).toBe(rows[0]?.source_hash)
  })

  it('never overwrites a description an editor changed', async () => {
    await client.query(
      `update skill_level_descriptions set description = jsonb_set(description, '{en}', '"edited by hand"') where assessment_id = $1 and level = 'good'`,
      [fixture.assessmentId]
    )
    await client.query(
      `update content_translations set status = 'reviewed' where entity_type = 'lesson' and entity_id = $1`,
      [fixture.lessonIds.assessment]
    )
    const stats = await syncLevelDescriptions(client, [course(fixture.slug, 'second')])
    expect(stats).toMatchObject({ created: 0, unchanged: 3 })
    const rows = await descriptions()
    expect(rows.find(row => row.level === 'good')?.description.en).toBe('edited by hand')
    expect(rows.find(row => row.level === 'intermediate')?.description.en).toBe('first intermediate')
    expect((await translations()).every(row => row.status === 'reviewed')).toBe(true)
  })

  it('fills only the row that is missing', async () => {
    await client.query(`delete from skill_level_descriptions where assessment_id = $1 and level = 'advanced'`, [
      fixture.assessmentId,
    ])
    const stats = await syncLevelDescriptions(client, [course(fixture.slug, 'third')])
    expect(stats).toMatchObject({ created: 1, unchanged: 2 })
    expect((await descriptions()).find(row => row.level === 'advanced')?.description.en).toBe('third advanced')
  })

  it('reports courses that have no assessment to attach to', async () => {
    const stats = await syncLevelDescriptions(client, [{ ...course('not-a-course-xyz', 'x') }])
    expect(stats.missing).toEqual(['not-a-course-xyz'])
  })

  it('deletes the descriptions with their assessment', async () => {
    await client.query('delete from user_assessments where assessment_id = $1', [fixture.assessmentId])
    await client.query('delete from assessments where id = $1', [fixture.assessmentId])
    expect(await descriptions()).toHaveLength(0)
    await client.query(
      `insert into assessments (id, lesson_id, description) overriding system value values ($1, $2, '{"en":"x","es":"x","it":"x"}'::jsonb)`,
      [fixture.assessmentId, fixture.lessonIds.assessment]
    )
  })
})
