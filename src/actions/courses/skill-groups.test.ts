import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from './learning.fixture'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/actions/guards', () => ({ requireEditor: vi.fn(() => Promise.resolve({ id: 'editor' })) }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const names = (suffix: string) => ({ en: `Test ${suffix}`, es: `Prueba ${suffix}`, it: `Prova ${suffix}` })

describe.skipIf(!isLocalDatabase)('skill framework actions', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let actions: typeof import('./skill-groups')
  const created: number[] = []

  beforeAll(async () => {
    context = await loadContext()
    ;[fixture, actions] = await Promise.all([createFixtureCourse(context), import('./skill-groups')])
  })

  afterAll(async () => {
    const { client, schema } = context
    await client.db.update(schema.courses).set({ skillGroupId: null }).where(eq(schema.courses.id, fixture.courseId))
    if (created.length > 0) await client.db.delete(schema.skillGroups).where(inArray(schema.skillGroups.id, created))
    await removeFixtureCourse(context, fixture)
  })

  it('creates groups with unique slugs and increasing order', async () => {
    const description = { en: '', es: '', it: '' }
    const first = await actions.saveSkillGroup({ description, icon: null, name: names('Group') })
    const second = await actions.saveSkillGroup({ description, icon: 'star', name: names('Group') })
    if (!('data' in first && 'data' in second)) throw new Error('Expected groups')
    created.push(first.data.id, second.data.id)

    const rows = await context.client.db.query.skillGroups.findMany({
      where: inArray(context.schema.skillGroups.id, created),
    })
    const byId = new Map(rows.map(row => [row.id, row]))
    expect(byId.get(first.data.id)?.slug).toBe('test-group')
    expect(byId.get(second.data.id)?.slug).toBe('test-group-2')
    expect(byId.get(second.data.id)!.sortOrder!).toBeGreaterThan(byId.get(first.data.id)!.sortOrder!)
  })

  it('rejects groups with a missing translation', async () => {
    const result = await actions.saveSkillGroup({
      description: { en: '', es: '', it: '' },
      icon: null,
      name: { en: 'Only English', es: '', it: '' },
    })
    expect(result).toMatchObject({ error: { code: 'INVALID_INPUT' } })
  })

  it('moves a group up and down', async () => {
    const [first, second] = created as [number, number]
    expect(await actions.moveSkillGroup({ direction: 'up', id: second })).toEqual({ data: { moved: true } })
    const rows = await context.client.db.query.skillGroups.findMany({
      where: inArray(context.schema.skillGroups.id, created),
    })
    const order = (id: number) => rows.find(row => row.id === id)?.sortOrder ?? 0
    expect(order(second)).toBeLessThan(order(first))
  })

  it('assigns a skill course to a group and refuses to delete a group in use', async () => {
    const [first] = created as [number]
    expect(await actions.assignSkillGroup({ courseId: fixture.courseId, groupId: first })).toEqual({
      data: { courseId: fixture.courseId },
    })
    expect(await actions.deleteSkillGroup(first)).toMatchObject({ error: { code: 'IN_USE' } })
    expect(await actions.assignSkillGroup({ courseId: fixture.courseId, groupId: null })).toMatchObject({
      data: { courseId: fixture.courseId },
    })
    expect(await actions.deleteSkillGroup(first)).toEqual({ data: { id: first } })
    created.splice(created.indexOf(first), 1)
  })
})
