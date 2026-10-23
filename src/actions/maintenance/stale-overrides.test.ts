import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { isLocalDatabase } from '@/actions/certificates/test-harness'

const mocks = vi.hoisted(() => ({ notify: vi.fn(async () => {}) }))

vi.mock('@/actions/notifications/notify', () => ({ notify: mocks.notify }))

const ORPHAN = 'Common.removedByStaleTest'

const DAY = 24 * 60 * 60 * 1000

describe.skipIf(!isLocalDatabase)('notifyStaleOverrides', () => {
  let client: typeof import('@/db/client')
  let schema: typeof import('@/db/schema')
  let run: typeof import('@/actions/maintenance/stale-overrides')

  const clear = async () => {
    await client.db.delete(schema.messageOverrides).where(eq(schema.messageOverrides.key, ORPHAN))
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.action, 'messages.stale'))
  }

  const events = async () =>
    await client.db.select().from(schema.activityEvents).where(eq(schema.activityEvents.action, 'messages.stale'))

  beforeAll(async () => {
    ;[client, schema, run] = await Promise.all([
      import('@/db/client'),
      import('@/db/schema'),
      import('@/actions/maintenance/stale-overrides'),
    ])
  })

  beforeEach(async () => {
    mocks.notify.mockClear()
    await clear()
  })

  afterAll(clear)

  const addOrphan = async () =>
    await client.db
      .insert(schema.messageOverrides)
      .values({ key: ORPHAN, locale: 'es', namespace: 'Common', sourceHash: 'x', value: 'Quitado' })

  it('stays quiet when no override is orphaned or incompatible', async () => {
    const result = await run.notifyStaleOverrides()
    expect(result.notified).toBe(result.orphaned + result.incompatible > 0)
    if (result.orphaned + result.incompatible === 0) expect(mocks.notify).not.toHaveBeenCalled()
  })

  it('records one event for the admins and does not repeat it within the week', async () => {
    await addOrphan()
    const first = await run.notifyStaleOverrides()
    expect(first).toMatchObject({ notified: true })
    expect(first.orphaned).toBeGreaterThanOrEqual(1)
    expect(mocks.notify).toHaveBeenCalledTimes(1)
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        data: { incompatible: first.incompatible, orphaned: first.orphaned },
        type: 'messages.stale',
      })
    )
    expect(await events()).toHaveLength(1)

    expect(await run.notifyStaleOverrides()).toMatchObject({ notified: false })
    expect(mocks.notify).toHaveBeenCalledTimes(1)
    expect(await events()).toHaveLength(1)
  })

  it('notifies again after a week or when the counts change', async () => {
    await addOrphan()
    await run.notifyStaleOverrides()
    expect(await run.notifyStaleOverrides(new Date(Date.now() + 8 * DAY))).toMatchObject({ notified: true })

    await client.db.delete(schema.messageOverrides).where(eq(schema.messageOverrides.key, ORPHAN))
    const changed = await run.notifyStaleOverrides()
    expect(changed.notified).toBe(changed.orphaned + changed.incompatible > 0)
  })
})
