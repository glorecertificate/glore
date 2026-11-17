import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from '@/actions/courses/learning.fixture'
import { fetchLevelDescriptions } from '@/actions/courses/level-descriptions'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const state = vi.hoisted(() => ({ allowed: false, userId: '' }))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/actions/guards', async importOriginal => ({
  ...(await importOriginal<typeof import('@/actions/guards')>()),
  requireEditor: vi.fn(() =>
    state.allowed ? Promise.resolve({ id: state.userId }) : Promise.reject(new Error('Not authorized'))
  ),
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const text = (value: string) => ({ en: value, es: `${value} es`, it: `${value} it` })

describe('level description guard', () => {
  it('lets only admins and editors write', async () => {
    const { isEditorUser } = await import('@/actions/guards')
    expect(isEditorUser({ role: 'admin' })).toBe(true)
    expect(isEditorUser({ isEditor: true, role: 'user' })).toBe(true)
    expect(isEditorUser({ role: 'user' })).toBe(false)
    expect(isEditorUser({ isEditor: false, role: 'tutor' })).toBe(false)
    expect(isEditorUser({ banned: true, role: 'admin' })).toBe(false)
    expect(isEditorUser(null)).toBe(false)
  })
})

describe.skipIf(!isLocalDatabase)('level description actions', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let management: typeof import('./management')

  const rows = async () => {
    const { client, schema } = context
    return await client.db
      .select()
      .from(schema.skillLevelDescriptions)
      .where(eq(schema.skillLevelDescriptions.assessmentId, fixture.assessmentId))
  }

  beforeAll(async () => {
    context = await loadContext('editor')
    state.userId = context.userId
    fixture = await createFixtureCourse(context)
    management = await import('./management')
  })

  afterAll(async () => {
    await removeFixtureCourse(context, fixture)
  })

  it('refuses callers who are not editors', async () => {
    state.allowed = false
    await expect(
      management.upsertLevelDescriptions([
        { assessmentId: fixture.assessmentId, description: text('Nope'), level: 'good' },
      ])
    ).rejects.toThrow('Not authorized')
    expect(await rows()).toHaveLength(0)
  })

  it('saves descriptions, updates them by level, and returns the shared read shape', async () => {
    state.allowed = true
    const saved = await management.upsertLevelDescriptions([
      { assessmentId: fixture.assessmentId, description: text('One'), level: 'intermediate' },
      { assessmentId: fixture.assessmentId, description: text('Two'), level: 'good' },
    ])
    expect(saved).toMatchObject({ data: [{ level: 'intermediate' }, { level: 'good' }] })
    await management.upsertLevelDescriptions([
      { assessmentId: fixture.assessmentId, description: text('Two changed'), level: 'good' },
    ])
    expect(await rows()).toHaveLength(2)

    const { data } = await fetchLevelDescriptions([fixture.courseId], { cache: false })
    const byLevel = data?.[fixture.courseId]
    expect(byLevel?.good).toMatchObject({ en: 'Two changed', es: 'Two changed es', it: 'Two changed it' })
    expect(typeof byLevel?.good?.id).toBe('number')
    expect(byLevel?.advanced).toBeUndefined()
  })

  it('rejects text over 200 characters', async () => {
    state.allowed = true
    const result = await management.upsertLevelDescriptions([
      { assessmentId: fixture.assessmentId, description: text('x'.repeat(201)), level: 'advanced' },
    ])
    expect(result).toMatchObject({ error: { code: 'INVALID_INPUT' } })
  })

  it('rejects assessments of courses that are not skills', async () => {
    state.allowed = true
    const { client, schema } = context
    await client.db.update(schema.courses).set({ type: 'intro' }).where(eq(schema.courses.id, fixture.courseId))
    const result = await management.upsertLevelDescriptions([
      { assessmentId: fixture.assessmentId, description: text('Intro'), level: 'advanced' },
    ])
    await client.db.update(schema.courses).set({ type: 'skill' }).where(eq(schema.courses.id, fixture.courseId))
    expect(result).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })

  it('deletes descriptions by id', async () => {
    state.allowed = true
    const ids = (await rows()).map(row => row.id)
    await management.deleteLevelDescriptions(ids)
    expect(await rows()).toHaveLength(0)
  })
})
