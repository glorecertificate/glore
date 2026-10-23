import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { isLocalDatabase } from '@/actions/certificates/test-harness'
import { flattenMessages } from '@/lib/message-overrides'
import { isProtectedKey } from '@/lib/message-validation'
import es from '~/messages/es.json'

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  editor: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), updateTag: mocks.updateTag }))
vi.mock('@/actions/guards', () => ({ requireEditor: mocks.editor }))
vi.mock('@/actions/admin/helpers', () => ({ requireAdmin: mocks.admin }))

const entries = Object.entries(flattenMessages(es))

const open = entries.find(([key, value]) => !isProtectedKey(key) && /^[^{}<>']*\{\w+\}[^{}<>']*$/u.test(value)) as [
  string,
  string,
]

const protectedKey = entries.find(([key]) => key === 'CertificatePdf.title') as [string, string]

const ORPHAN = 'Common.removedByT3Test'

describe.skipIf(!isLocalDatabase)('message override actions', () => {
  let client: typeof import('@/db/client')
  let schema: typeof import('@/db/schema')
  let actions: typeof import('@/actions/messages')

  const cleanup = async () => {
    const keys = [open[0], protectedKey[0], ORPHAN]
    await client.db.delete(schema.messageOverrides).where(inArray(schema.messageOverrides.key, keys))
    await client.db.delete(schema.messageOverrideRevisions).where(inArray(schema.messageOverrideRevisions.key, keys))
    await client.db.delete(schema.activityEvents).where(
      and(
        eq(schema.activityEvents.subjectType, 'message'),
        inArray(
          schema.activityEvents.subjectId,
          ['es', 'en'].flatMap(locale => keys.map(key => `${locale}:${key}`))
        )
      )
    )
  }

  beforeAll(async () => {
    ;[client, schema, actions] = await Promise.all([
      import('@/db/client'),
      import('@/db/schema'),
      import('@/actions/messages'),
    ])
    await cleanup()
  })

  beforeEach(async () => {
    const [user] = await client.db.select({ id: schema.users.id }).from(schema.users).limit(1)
    mocks.editor.mockReset().mockResolvedValue({ id: user?.id })
    mocks.admin.mockReset().mockResolvedValue({ id: user?.id })
    mocks.updateTag.mockClear()
  })

  afterAll(cleanup)

  it('rejects input that is not a message target', async () => {
    expect(await actions.saveMessageDraft({ key: 'nope', locale: 'es', value: 'x' })).toMatchObject({
      error: { code: 'INVALID_INPUT' },
    })
    expect(await actions.saveMessageDraft({ key: open[0], locale: 'fr', value: 'x' })).toMatchObject({
      error: { code: 'INVALID_INPUT' },
    })
  })

  it('rejects a draft that drops a placeholder, breaks ICU, or targets a removed key', async () => {
    const removed = open[1].replaceAll(/\{\w+\}/gu, 'x')
    expect(await actions.saveMessageDraft({ key: open[0], locale: 'es', value: removed })).toMatchObject({
      error: { code: 'INCOMPATIBLE' },
    })
    expect(await actions.saveMessageDraft({ key: open[0], locale: 'es', value: `${open[1]} {` })).toMatchObject({
      error: { code: 'INVALID' },
    })
    expect(await actions.saveMessageDraft({ key: 'Common.removedKey', locale: 'es', value: 'x' })).toMatchObject({
      error: { code: 'ORPHANED' },
    })
  })

  it('lets an editor draft, publish, and reset a regular key', async () => {
    const text = `[edited] ${open[1]}`
    const draft = await actions.saveMessageDraft({ key: open[0], locale: 'es', value: text })
    expect(draft).toMatchObject({ data: { draftValue: text, hasDraft: true, value: null } })
    expect(mocks.updateTag).not.toHaveBeenCalled()

    const published = await actions.publishMessage({ key: open[0], locale: 'es' })
    expect(published).toMatchObject({ data: { draftValue: null, isPublished: true, value: text } })
    expect(mocks.updateTag).toHaveBeenCalledTimes(1)
    expect(mocks.updateTag).toHaveBeenCalledWith('messages-es')
    expect(await actions.publishMessage({ key: open[0], locale: 'es' })).toMatchObject({ error: { code: 'NO_DRAFT' } })

    mocks.updateTag.mockClear()
    expect(await actions.resetMessage({ key: open[0], locale: 'es' })).toEqual({ data: { key: open[0], locale: 'es' } })
    expect(mocks.updateTag).toHaveBeenCalledWith('messages-es')
    expect(await actions.resetMessage({ key: open[0], locale: 'es' })).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })

  it('expires every locale when the default locale publishes', async () => {
    const source = flattenMessages((await import('~/messages/en.json')).default)[open[0]] as string
    await actions.saveMessageDraft({ key: open[0], locale: 'en', value: `[edited] ${source}` })
    await actions.publishMessage({ key: open[0], locale: 'en' })
    expect(mocks.updateTag.mock.calls.map(([tag]) => tag).toSorted()).toEqual([
      'messages-en',
      'messages-es',
      'messages-it',
    ])
    await actions.resetMessage({ key: open[0], locale: 'en' })
  })

  it('discards a draft without expiring the cache', async () => {
    await actions.saveMessageDraft({ key: open[0], locale: 'es', value: `[edited] ${open[1]}` })
    expect(await actions.discardMessageDraft({ key: open[0], locale: 'es' })).toEqual({
      data: { key: open[0], locale: 'es', remaining: false },
    })
    expect(mocks.updateTag).not.toHaveBeenCalled()
  })

  it('keeps protected keys behind the admin guard', async () => {
    mocks.admin.mockRejectedValue(new Error('FORBIDDEN'))
    const result = await actions.saveMessageDraft({ key: protectedKey[0], locale: 'es', value: `${protectedKey[1]}!` })
    expect(result).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(mocks.editor).not.toHaveBeenCalled()
  })

  it('lets an admin publish a protected key', async () => {
    const text = `${protectedKey[1]}!`
    expect(await actions.saveMessageDraft({ key: protectedKey[0], locale: 'es', value: text })).toMatchObject({
      data: { hasDraft: true },
    })
    expect(await actions.publishMessage({ key: protectedKey[0], locale: 'es' })).toMatchObject({
      data: { value: text },
    })
    expect(mocks.editor).not.toHaveBeenCalled()
  })

  it('lets only an admin delete an override whose key left the bundle', async () => {
    await client.db
      .insert(schema.messageOverrides)
      .values({ key: ORPHAN, locale: 'es', namespace: 'Common', sourceHash: 'x', value: 'Quitado' })
    mocks.admin.mockRejectedValue(new Error('FORBIDDEN'))
    expect(await actions.resetMessage({ key: ORPHAN, locale: 'es' })).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(
      await client.db.select().from(schema.messageOverrides).where(eq(schema.messageOverrides.key, ORPHAN))
    ).toHaveLength(1)

    mocks.admin.mockResolvedValue({
      id: (await client.db.select({ id: schema.users.id }).from(schema.users).limit(1))[0]?.id,
    })
    expect(await actions.resetMessage({ key: ORPHAN, locale: 'es' })).toEqual({ data: { key: ORPHAN, locale: 'es' } })
    expect(
      await client.db.select().from(schema.messageOverrides).where(eq(schema.messageOverrides.key, ORPHAN))
    ).toHaveLength(0)
  })

  it('blocks a regular key when the editor guard fails', async () => {
    mocks.editor.mockRejectedValue(new Error('Not authorized'))
    expect(await actions.resetMessage({ key: open[0], locale: 'es' })).toMatchObject({ error: { code: 'FORBIDDEN' } })
  })
})
