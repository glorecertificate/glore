import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { isLocalDatabase } from '@/actions/certificates/test-harness'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'

describe.skipIf(!isLocalDatabase)('app settings mutations', () => {
  let client: typeof import('@/db/client')
  let schema: typeof import('@/db/schema')
  let mutations: typeof import('@/db/mutations/app-settings')
  let actorId: string

  const clean = async () => {
    await client.db.delete(schema.appSettings)
    await client.db
      .delete(schema.activityEvents)
      .where(and(eq(schema.activityEvents.subjectType, 'settings'), eq(schema.activityEvents.subjectId, 'app')))
  }

  const events = async () =>
    await client.db
      .select()
      .from(schema.activityEvents)
      .where(
        and(eq(schema.activityEvents.subjectType, 'settings'), eq(schema.activityEvents.action, 'settings.updated'))
      )

  beforeAll(async () => {
    ;[client, schema, mutations] = await Promise.all([
      import('@/db/client'),
      import('@/db/schema'),
      import('@/db/mutations/app-settings'),
    ])
    const [user] = await client.db.select({ id: schema.users.id }).from(schema.users).limit(1)
    if (!user) throw new Error('Seed the database first')
    actorId = user.id
    await clean()
  })

  afterAll(clean)

  it('stores only the keys that differ from the effective settings', async () => {
    const settings = { ...DEFAULT_SETTINGS, email: 'team@example.org' }
    const result = await client.transaction(tx => mutations.saveAppSettings(tx, { actorId, settings }))
    expect(result.keys).toEqual(['email'])

    const rows = await client.db.select().from(schema.appSettings)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ key: 'email', updatedById: actorId, value: 'team@example.org' })
    expect(await events()).toHaveLength(1)
  })

  it('records nothing when nothing changed', async () => {
    const settings = { ...DEFAULT_SETTINGS, email: 'team@example.org' }
    const result = await client.transaction(tx => mutations.saveAppSettings(tx, { actorId, settings }))
    expect(result).toEqual({ event: null, keys: [] })
    expect(await events()).toHaveLength(1)
  })

  it('updates a stored key and records the changed keys', async () => {
    const settings = { ...DEFAULT_SETTINGS, email: 'other@example.org', website: 'https://example.org' }
    const result = await client.transaction(tx => mutations.saveAppSettings(tx, { actorId, settings }))
    expect(result.keys).toEqual(['email', 'website'])

    const [email] = await client.db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'email'))
    expect(email?.value).toBe('other@example.org')
    const recorded = await events()
    expect(recorded.map(event => event.metadata)).toContainEqual({ keys: ['email', 'website'] })
  })
})
