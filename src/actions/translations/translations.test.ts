import { MockLanguageModelV3 } from 'ai/test'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  type FixtureCourse,
  type LearningContext,
  createFixtureCourse,
  loadContext,
  removeFixtureCourse,
} from '@/actions/courses/learning.fixture'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const state = vi.hoisted(() => ({ models: null as unknown[] | null, userId: '' }))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/actions/guards', () => ({ requireEditor: vi.fn(() => Promise.resolve({ id: state.userId })) }))
vi.mock('@/lib/rate-limit', () => ({ isRateLimited: vi.fn(() => Promise.resolve(false)) }))
vi.mock('@/lib/ai', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/ai')>()),
  resolveAiModels: () => state.models,
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const modelAnswering = (answer: (fragments: Record<string, string>) => unknown) =>
  new MockLanguageModelV3({
    doGenerate: ({ prompt }) => {
      const user = prompt.find(message => message.role === 'user')
      const text =
        user && Array.isArray(user.content)
          ? user.content.map(part => ('text' in part ? part.text : '')).join('')
          : '{}'
      return Promise.resolve({
        content: [{ text: JSON.stringify(answer(JSON.parse(text) as Record<string, string>)), type: 'text' as const }],
        finishReason: { raw: 'stop', unified: 'stop' as const },
        usage,
        warnings: [],
      })
    },
  })

const spanish = () =>
  modelAnswering(fragments => Object.fromEntries(Object.entries(fragments).map(([key, text]) => [key, `ES ${text}`])))

describe.skipIf(!isLocalDatabase)('content translation actions', () => {
  let context: LearningContext
  let fixture: FixtureCourse
  let translations: typeof import('./ai') & typeof import('./states')
  let groups: typeof import('@/actions/courses/skill-groups')
  let management: typeof import('@/actions/courses/management')
  let groupId = 0

  const states = async (entityType: 'course' | 'lesson' | 'skill_group', entityId: number) => {
    const result = await translations.listTranslationStates({ entityId, entityType })
    if (!('data' in result)) throw new Error('Expected states')
    return result.data
  }

  const stateOf = async (entityType: 'course' | 'lesson' | 'skill_group', entityId: number, locale = 'es') =>
    (await states(entityType, entityId))
      .find(item => item.entityType === entityType && item.entityId === entityId)
      ?.locales.find(item => item.locale === locale)?.state

  const events = async (action: string) => {
    const { activityEvents } = context.schema
    return await context.client.db.select().from(activityEvents).where(eq(activityEvents.action, action))
  }

  beforeAll(async () => {
    context = await loadContext('editor')
    state.userId = context.userId
    const [fixtureCourse, ai, review, skillGroups, courseManagement] = await Promise.all([
      createFixtureCourse(context),
      import('./ai'),
      import('./states'),
      import('@/actions/courses/skill-groups'),
      import('@/actions/courses/management'),
    ])
    fixture = fixtureCourse
    translations = { ...ai, ...review }
    groups = skillGroups
    management = courseManagement
    const created = await groups.saveSkillGroup({
      description: { en: 'How we talk', es: 'Cómo hablamos', it: 'Come parliamo' },
      icon: null,
      name: { en: 'Fixture group', es: 'Grupo de prueba', it: 'Gruppo di prova' },
    })
    if (!('data' in created)) throw new Error('Expected a group')
    groupId = created.data.id
  })

  afterAll(async () => {
    const { client, schema } = context
    await client.db.delete(schema.contentTranslations).where(eq(schema.contentTranslations.entityType, 'skill_group'))
    await client.db.delete(schema.skillGroups).where(eq(schema.skillGroups.id, groupId))
    await client.db
      .delete(schema.activityEvents)
      .where(
        and(
          inArray(schema.activityEvents.subjectType, ['skill_group', 'course']),
          inArray(schema.activityEvents.subjectId, [String(groupId), String(fixture.courseId)])
        )
      )
    await client.db
      .delete(schema.contentTranslations)
      .where(
        and(
          eq(schema.contentTranslations.entityType, 'lesson'),
          inArray(schema.contentTranslations.entityId, Object.values(fixture.lessonIds))
        )
      )
    await removeFixtureCourse(context, fixture)
  })

  it('treats existing translated text without a row as a draft', async () => {
    expect(await stateOf('skill_group', groupId)).toBe('draft')
    expect(await stateOf('skill_group', groupId, 'it')).toBe('draft')
  })

  it('refuses to replace human text until the caller confirms', async () => {
    state.models = [spanish()]
    const result = await translations.translateEntity({ entityId: groupId, entityType: 'skill_group', locale: 'es' })
    expect(result).toMatchObject({ error: { code: 'EXISTS' } })
    expect(await stateOf('skill_group', groupId)).toBe('draft')
  })

  it('translates with the mocked model, saves the locale, and marks it machine', async () => {
    const result = await translations.translateEntity({
      entityId: groupId,
      entityType: 'skill_group',
      locale: 'es',
      overwrite: true,
    })
    expect(result).toMatchObject({ data: { translated: 2 } })

    const row = await context.client.db.query.skillGroups.findFirst({
      where: eq(context.schema.skillGroups.id, groupId),
    })
    expect(row?.name).toEqual({ en: 'Fixture group', es: 'ES Fixture group', it: 'Gruppo di prova' })
    expect(row?.description).toEqual({ en: 'How we talk', es: 'ES How we talk', it: 'Come parliamo' })
    expect(await stateOf('skill_group', groupId)).toBe('machine')
    expect(await stateOf('skill_group', groupId, 'it')).toBe('draft')
  })

  it('replaces a machine translation without asking', async () => {
    const result = await translations.translateEntity({ entityId: groupId, entityType: 'skill_group', locale: 'es' })
    expect(result).toMatchObject({ data: { translated: 2 } })
  })

  it('saves nothing when the model answers with unusable output', async () => {
    state.models = [modelAnswering(() => ({ 0: 'only one key' }))]
    const result = await translations.translateEntity({
      entityId: groupId,
      entityType: 'skill_group',
      locale: 'it',
      overwrite: true,
    })
    expect(result).toMatchObject({ error: { code: 'AI_INVALID' } })
    const row = await context.client.db.query.skillGroups.findFirst({
      where: eq(context.schema.skillGroups.id, groupId),
    })
    expect(row?.name.it).toBe('Gruppo di prova')
    expect(await stateOf('skill_group', groupId, 'it')).toBe('draft')
  })

  it('reports an environment without models', async () => {
    state.models = null
    const result = await translations.translateEntity({
      entityId: groupId,
      entityType: 'skill_group',
      locale: 'es',
      overwrite: true,
    })
    expect(result).toMatchObject({ error: { code: 'ai_not_configured' } })
  })

  it('marks a locale reviewed, records the audit event, and rejects a locale without content', async () => {
    expect(
      await translations.reviewTranslation({ entityId: groupId, entityType: 'skill_group', locale: 'es' })
    ).toEqual({ data: { reviewed: 1 } })
    expect(await stateOf('skill_group', groupId)).toBe('reviewed')
    const reviewed = (await events('content.translation_reviewed')).filter(event => event.subjectId === String(groupId))
    expect(reviewed).toHaveLength(1)
    expect(reviewed[0]?.metadata).toMatchObject({ entityType: 'skill_group', locale: 'es', slug: expect.any(String) })
    expect(reviewed[0]?.actorId).toBe(context.userId)
  })

  it('flags the translations as outdated after the English text changes', async () => {
    const result = await groups.saveSkillGroup({
      description: { en: 'How we talk', es: 'ES How we talk', it: 'Come parliamo' },
      icon: null,
      id: groupId,
      name: { en: 'Fixture group renamed', es: 'ES Fixture group', it: 'Gruppo di prova' },
    })
    expect(result).toMatchObject({ data: { id: groupId } })
    expect(await stateOf('skill_group', groupId)).toBe('outdated')
    const updated = (await events('skill_group.updated')).filter(event => event.subjectId === String(groupId))
    expect(updated.at(-1)?.metadata).toMatchObject({ entityType: 'skill_group', locales: ['en'] })
  })

  it('turns a hand edit of a reviewed locale into a draft and keeps it outdated', async () => {
    await groups.saveSkillGroup({
      description: { en: 'How we talk', es: 'ES How we talk', it: 'Come parliamo' },
      icon: null,
      id: groupId,
      name: { en: 'Fixture group renamed', es: 'Grupo renombrado', it: 'Gruppo di prova' },
    })
    expect(await stateOf('skill_group', groupId)).toBe('outdated')
    const row = await context.client.db.query.contentTranslations.findFirst({
      where: and(
        eq(context.schema.contentTranslations.entityType, 'skill_group'),
        eq(context.schema.contentTranslations.entityId, groupId),
        eq(context.schema.contentTranslations.locale, 'es')
      ),
    })
    expect(row).toMatchObject({ reviewedById: null, status: 'draft' })
  })

  it('clears the outdated flag when a person reviews the locale again', async () => {
    await translations.reviewTranslation({ entityId: groupId, entityType: 'skill_group', locale: 'es' })
    expect(await stateOf('skill_group', groupId)).toBe('reviewed')
  })

  it('translates a lesson with Plate content and keeps its structure', async () => {
    state.models = [spanish()]
    const lessonId = fixture.lessonIds.reading
    expect(await stateOf('lesson', lessonId)).toBe('draft')
    const result = await translations.translateEntity({
      entityId: lessonId,
      entityType: 'lesson',
      locale: 'es',
      overwrite: true,
    })
    expect(result).toMatchObject({ data: { translated: 2 } })
    const lesson = await context.client.db.query.lessons.findFirst({
      where: eq(context.schema.lessons.id, lessonId),
    })
    expect(lesson?.content).toMatchObject({
      en: [{ children: [{ text: 'Read me' }], type: 'p' }],
      es: [{ children: [{ text: 'ES Read me' }], type: 'p' }],
    })
    expect(lesson?.title).toMatchObject({ en: 'Reading', es: 'ES Reading' })
    expect(await stateOf('lesson', lessonId)).toBe('machine')
  })

  it('lists the course and its lessons together', async () => {
    const items = await states('course', fixture.courseId)
    expect(items.map(item => item.entityType)).toEqual(['course', 'lesson', 'lesson', 'lesson'])
  })

  it('marks edited lessons as drafts and ignores locales without content', async () => {
    const lessonId = fixture.lessonIds.reading
    await translations.markTranslationsEdited({
      course: false,
      courseId: fixture.courseId,
      lessonIds: [lessonId],
      locale: 'es',
    })
    expect(await stateOf('lesson', lessonId)).toBe('draft')
    expect(await stateOf('lesson', fixture.lessonIds.quiz)).toBe('draft')
  })

  it('records an audit event for each locale a course gains or loses', async () => {
    await management.updateCourse(fixture.courseId, { languages: ['en', 'it', 'es'] })
    await management.updateCourse(fixture.courseId, { languages: ['en', 'es'] })
    const published = (await events('course.locale_published')).filter(
      event => event.subjectId === String(fixture.courseId)
    )
    expect(published.map(event => [event.metadata.locale, event.metadata.published])).toEqual([
      ['es', true],
      ['it', false],
    ])
  })
})
