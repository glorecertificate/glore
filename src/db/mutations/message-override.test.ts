import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { isLocalDatabase } from '@/actions/certificates/test-harness'

const KEY = 'TestNamespace.mutation.greeting'

describe.skipIf(!isLocalDatabase)('message override mutations', () => {
  let client: typeof import('@/db/client')
  let schema: typeof import('@/db/schema')
  let mutations: typeof import('@/db/mutations/message-override')
  let actorId: string

  const target = { key: KEY, locale: 'es' } as const
  const hashes = { baseHash: 'base-1', sourceHash: 'source-1' }

  const row = async () =>
    (
      await client.db
        .select()
        .from(schema.messageOverrides)
        .where(and(eq(schema.messageOverrides.locale, 'es'), eq(schema.messageOverrides.key, KEY)))
    )[0]

  const actions = async () =>
    (
      await client.db
        .select({ action: schema.messageOverrideRevisions.action })
        .from(schema.messageOverrideRevisions)
        .where(eq(schema.messageOverrideRevisions.key, KEY))
        .orderBy(schema.messageOverrideRevisions.id)
    ).map(item => item.action)

  const clean = async () => {
    await client.db.delete(schema.messageOverrides).where(eq(schema.messageOverrides.key, KEY))
    await client.db.delete(schema.messageOverrideRevisions).where(eq(schema.messageOverrideRevisions.key, KEY))
    await client.db
      .delete(schema.activityEvents)
      .where(and(eq(schema.activityEvents.subjectType, 'message'), eq(schema.activityEvents.subjectId, `es:${KEY}`)))
  }

  beforeAll(async () => {
    ;[client, schema, mutations] = await Promise.all([
      import('@/db/client'),
      import('@/db/schema'),
      import('@/db/mutations/message-override'),
    ])
    const [user] = await client.db.select({ id: schema.users.id }).from(schema.users).limit(1)
    if (!user) throw new Error('Seed the database first')
    actorId = user.id
    await clean()
  })

  afterAll(clean)

  it('saves a draft that does not touch the published text', async () => {
    const saved = await client.transaction(tx =>
      mutations.saveMessageDraft(tx, { ...target, ...hashes, actorId, value: 'Hola {name}' })
    )
    expect(saved).toMatchObject({ draftValue: 'Hola {name}', namespace: 'TestNamespace', value: null })
    expect(await actions()).toEqual(['draft'])
  })

  it('refuses to publish without a matching draft', async () => {
    await expect(
      client.transaction(tx =>
        mutations.publishMessageDraft(tx, { ...target, ...hashes, actorId, expected: 'Other {name}' })
      )
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    await expect(
      client.transaction(tx =>
        mutations.publishMessageDraft(tx, { actorId, expected: 'x', key: 'Missing.key', locale: 'es', ...hashes })
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('publishes the draft, records the revision, and emits the event', async () => {
    const { event, row: published } = await client.transaction(tx =>
      mutations.publishMessageDraft(tx, {
        ...target,
        actorId,
        baseHash: 'base-2',
        expected: 'Hola {name}',
        sourceHash: 'source-2',
      })
    )
    expect(published).toMatchObject({
      baseHash: 'base-2',
      draftValue: null,
      publishedById: actorId,
      sourceHash: 'source-2',
      value: 'Hola {name}',
    })
    expect(event).toMatchObject({ action: 'messages.published', subjectId: `es:${KEY}`, subjectType: 'message' })
    expect(event.metadata).toEqual({ key: KEY, locale: 'es', namespace: 'TestNamespace' })
    expect(await actions()).toEqual(['draft', 'publish'])
  })

  it('keeps the published hashes while a new draft is edited', async () => {
    await client.transaction(tx =>
      mutations.saveMessageDraft(tx, {
        ...target,
        actorId,
        baseHash: 'base-3',
        sourceHash: 'source-3',
        value: 'Buenas {name}',
      })
    )
    expect(await row()).toMatchObject({
      baseHash: 'base-2',
      draftValue: 'Buenas {name}',
      sourceHash: 'source-2',
      value: 'Hola {name}',
    })
  })

  it('discards a draft and keeps the published text', async () => {
    expect(await client.transaction(tx => mutations.discardMessageDraft(tx, { ...target, actorId }))).toEqual({
      remaining: true,
    })
    expect(await row()).toMatchObject({ draftValue: null, value: 'Hola {name}' })
    await expect(
      client.transaction(tx => mutations.discardMessageDraft(tx, { ...target, actorId }))
    ).rejects.toMatchObject({ code: 'NO_DRAFT' })
  })

  it('deletes a draft-only row on discard', async () => {
    await client.transaction(tx => mutations.resetMessageOverride(tx, { ...target, actorId }))
    await client.transaction(tx =>
      mutations.saveMessageDraft(tx, { ...target, ...hashes, actorId, value: 'Solo {name}' })
    )
    expect(await client.transaction(tx => mutations.discardMessageDraft(tx, { ...target, actorId }))).toEqual({
      remaining: false,
    })
    expect(await row()).toBeUndefined()
  })

  it('resets a published override and keeps the revisions', async () => {
    await client.transaction(tx =>
      mutations.saveMessageDraft(tx, { ...target, ...hashes, actorId, value: 'Hola {name}' })
    )
    await client.transaction(tx =>
      mutations.publishMessageDraft(tx, { ...target, ...hashes, actorId, expected: 'Hola {name}' })
    )
    const { event, wasPublished } = await client.transaction(tx =>
      mutations.resetMessageOverride(tx, { ...target, actorId })
    )
    expect(wasPublished).toBe(true)
    expect(event).toMatchObject({ action: 'messages.reset' })
    expect(await row()).toBeUndefined()
    expect((await actions()).at(-1)).toBe('reset')
    await expect(
      client.transaction(tx => mutations.resetMessageOverride(tx, { ...target, actorId }))
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})
