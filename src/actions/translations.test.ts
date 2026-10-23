import { MockLanguageModelV3 } from 'ai/test'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { isLocalDatabase } from '@/actions/certificates/test-harness'
import { flattenMessages } from '@/lib/message-overrides'
import { isProtectedKey } from '@/lib/message-validation'
import es from '~/messages/es.json'

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  answer: { text: '' },
  editor: vi.fn(),
  limited: vi.fn(),
  models: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), updateTag: mocks.updateTag }))
vi.mock('@/actions/guards', () => ({ requireEditor: mocks.editor }))
vi.mock('@/actions/admin/helpers', () => ({ requireAdmin: mocks.admin }))
vi.mock('@/lib/rate-limit', () => ({ isRateLimited: mocks.limited }))
vi.mock('@/lib/ai', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/ai')>()),
  resolveAiModels: mocks.models,
}))

const model = () =>
  new MockLanguageModelV3({
    doGenerate: () =>
      Promise.resolve({
        content: [{ text: mocks.answer.text, type: 'text' as const }],
        finishReason: { raw: 'stop', unified: 'stop' as const },
        usage,
        warnings: [],
      }),
  })

const entries = Object.entries(flattenMessages(es))

const open = entries.findLast(([key, value]) => !isProtectedKey(key) && /^[^{}<>']*\{\w+\}[^{}<>']*$/u.test(value)) as [
  string,
  string,
]

const protectedKey = entries.find(([key]) => key === 'Metadata.title') as [string, string]

const ORPHAN = 'Common.removedByT3Translations'

describe.skipIf(!isLocalDatabase)('translations actions', () => {
  let client: typeof import('@/db/client')
  let schema: typeof import('@/db/schema')
  let actions: typeof import('@/actions/translations')
  let messages: typeof import('@/actions/messages')

  const keys = [open[0], protectedKey[0], ORPHAN]

  const cleanup = async () => {
    await client.db.delete(schema.messageOverrides).where(inArray(schema.messageOverrides.key, keys))
    await client.db.delete(schema.messageOverrideRevisions).where(inArray(schema.messageOverrideRevisions.key, keys))
    await client.db.delete(schema.activityEvents).where(
      and(
        eq(schema.activityEvents.subjectType, 'message'),
        inArray(
          schema.activityEvents.subjectId,
          ['es', 'en', 'it'].flatMap(locale => keys.map(key => `${locale}:${key}`))
        )
      )
    )
  }

  const overrideOf = async (key: string, locale = 'es') => {
    const [row] = await client.db
      .select()
      .from(schema.messageOverrides)
      .where(and(eq(schema.messageOverrides.key, key), eq(schema.messageOverrides.locale, locale)))
    return row
  }

  beforeAll(async () => {
    ;[client, schema, actions, messages] = await Promise.all([
      import('@/db/client'),
      import('@/db/schema'),
      import('@/actions/translations'),
      import('@/actions/messages'),
    ])
    await cleanup()
  })

  beforeEach(async () => {
    const [user] = await client.db.select({ id: schema.users.id }).from(schema.users).limit(1)
    mocks.editor.mockReset().mockResolvedValue({ id: user?.id })
    mocks.admin.mockReset().mockResolvedValue({ id: user?.id })
    mocks.limited.mockReset().mockResolvedValue(false)
    mocks.models.mockReset().mockReturnValue([model()])
    mocks.answer.text = ''
    mocks.updateTag.mockClear()
  })

  afterAll(cleanup)

  it('loads the catalogs of every locale and classifies the overrides for an editor', async () => {
    await client.db
      .insert(schema.messageOverrides)
      .values({ key: ORPHAN, locale: 'es', namespace: 'Common', sourceHash: 'x', value: 'Quitado' })
    const result = await actions.loadTranslations()
    if (!('data' in result)) throw new Error('Expected data')
    expect(Object.keys(result.data.catalogs).toSorted()).toEqual(['en', 'es', 'it'])
    expect(result.data.catalogs.es?.[open[0]]).toBe(open[1])
    expect(result.data.overrides.find(({ key }) => key === ORPHAN)).toMatchObject({
      locale: 'es',
      stale: 'orphaned',
      value: 'Quitado',
    })
  })

  it('refuses the data to anyone who is not an editor', async () => {
    mocks.editor.mockRejectedValue(new Error('Not authorized'))
    expect(await actions.loadTranslations()).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(await actions.listMessageOverrides()).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(await actions.listMessageHistory({ key: open[0], locale: 'es' })).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
  })

  it('lists the history of a key, newest first', async () => {
    const text = `[edited] ${open[1]}`
    await messages.saveMessageDraft({ key: open[0], locale: 'es', value: text })
    await messages.publishMessage({ key: open[0], locale: 'es' })
    const result = await actions.listMessageHistory({ key: open[0], locale: 'es' })
    if (!('data' in result)) throw new Error('Expected data')
    expect(result.data.map(({ action }) => action)).toEqual(['publish', 'draft'])
    expect(result.data[0]?.value).toBe(text)
    expect(await actions.listMessageHistory({ key: 'nope', locale: 'es' })).toMatchObject({
      error: { code: 'INVALID_INPUT' },
    })
    await messages.resetMessage({ key: open[0], locale: 'es' })
  })

  describe('suggestMessage', () => {
    it('saves a valid suggestion as a machine draft and never publishes it', async () => {
      mocks.answer.text = `[ai] ${open[1]}`
      const result = await actions.suggestMessage({ key: open[0], locale: 'es' })
      expect(result).toEqual({ data: { key: open[0], locale: 'es', value: `[ai] ${open[1]}` } })
      expect(await overrideOf(open[0])).toMatchObject({
        draftValue: `[ai] ${open[1]}`,
        origin: 'machine',
        value: null,
      })
      expect(mocks.updateTag).not.toHaveBeenCalled()
      await messages.discardMessageDraft({ key: open[0], locale: 'es' })
    })

    it('keeps the origin human when a person saves a draft afterwards', async () => {
      mocks.answer.text = `[ai] ${open[1]}`
      await actions.suggestMessage({ key: open[0], locale: 'es' })
      await messages.saveMessageDraft({ key: open[0], locale: 'es', value: `[me] ${open[1]}` })
      expect(await overrideOf(open[0])).toMatchObject({ draftValue: `[me] ${open[1]}`, origin: 'human' })
      await messages.discardMessageDraft({ key: open[0], locale: 'es' })
    })

    it('does not save a suggestion that drops a placeholder', async () => {
      mocks.answer.text = 'Texto sin marcadores'
      expect(await actions.suggestMessage({ key: open[0], locale: 'es' })).toMatchObject({
        error: { code: 'AI_INCOMPATIBLE' },
      })
      expect(await overrideOf(open[0])).toBeUndefined()
    })

    it('does not save a suggestion with broken ICU syntax', async () => {
      mocks.answer.text = `${open[1]} {`
      expect(await actions.suggestMessage({ key: open[0], locale: 'es' })).toMatchObject({
        error: { code: 'AI_INVALID' },
      })
      expect(await overrideOf(open[0])).toBeUndefined()
    })

    it('only suggests translations, not the default locale', async () => {
      expect(await actions.suggestMessage({ key: open[0], locale: 'en' })).toMatchObject({
        error: { code: 'INVALID_INPUT' },
      })
      expect(await actions.suggestMessage({ key: 'nope', locale: 'es' })).toMatchObject({
        error: { code: 'INVALID_INPUT' },
      })
      expect(mocks.models).not.toHaveBeenCalled()
    })

    it('keeps protected keys behind the admin guard', async () => {
      mocks.admin.mockRejectedValue(new Error('FORBIDDEN'))
      expect(await actions.suggestMessage({ key: protectedKey[0], locale: 'es' })).toMatchObject({
        error: { code: 'FORBIDDEN' },
      })
      expect(mocks.editor).not.toHaveBeenCalled()
      expect(mocks.models).not.toHaveBeenCalled()
    })

    it('checks the rate limit before calling the model', async () => {
      mocks.limited.mockResolvedValue(true)
      expect(await actions.suggestMessage({ key: open[0], locale: 'es' })).toMatchObject({
        error: { code: 'RATE_LIMITED' },
      })
      expect(mocks.models).not.toHaveBeenCalled()
    })

    it('reports a server without an AI key', async () => {
      mocks.models.mockReturnValue(null)
      expect(await actions.suggestMessage({ key: open[0], locale: 'es' })).toMatchObject({
        error: { code: 'AI_NOT_CONFIGURED' },
      })
    })
  })
})
