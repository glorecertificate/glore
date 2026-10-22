import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX, seedEmail } from '~/scripts/seed-data'

const authUser = vi.hoisted(() => ({ current: null as { id: string } | null }))

vi.mock('@/actions/auth', () => ({ getAuthUser: () => Promise.resolve(authUser.current) }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const TYPES = ['certificate.approved', 'course.completed', 'invite_link.created', 'team.invited']

describe.skipIf(!isLocalDatabase)('notification inbox', () => {
  let context: {
    client: typeof import('@/db/client')
    inbox: typeof import('@/actions/notifications/inbox')
    ids: { tutor: string; volunteer: string }
    schema: typeof import('@/db/schema')
  }

  const cleanup = async () => {
    const { client, ids, schema } = context
    await client.db.delete(schema.notifications).where(inArray(schema.notifications.userId, [ids.tutor, ids.volunteer]))
  }

  const seed = async () => {
    const { client, ids, schema } = context
    const base = Date.now() - 60_000
    await client.db.insert(schema.notifications).values([
      ...TYPES.map((type, index) => ({
        createdAt: new Date(base + index * 1000).toISOString(),
        type,
        url: '/dashboard',
        userId: ids.volunteer,
      })),
      { type: 'certificate.approved', url: '/dashboard', userId: ids.tutor },
    ])
  }

  beforeAll(async () => {
    const [client, inbox, schema] = await Promise.all([
      import('@/db/client'),
      import('@/actions/notifications/inbox'),
      import('@/db/schema'),
    ])
    const people = await client.db.query.users.findMany({
      columns: { email: true, id: true },
      where: inArray(schema.users.email, [seedEmail('editor'), seedEmail('learner')]),
    })
    const editor = people.find(({ email }) => email === seedEmail('editor'))
    const learner = people.find(({ email }) => email === seedEmail('learner'))
    if (!(editor && learner)) throw new Error('Run pnpm run db:seed first')
    context = { client, ids: { tutor: editor.id, volunteer: learner.id }, inbox, schema }
  })

  beforeEach(async () => {
    await cleanup()
    await seed()
    authUser.current = { id: context.ids.volunteer }
  })

  afterAll(async () => {
    await cleanup()
  })

  it('lists the newest first and reports more pages', async () => {
    const { data } = await context.inbox.listNotifications({ limit: 3 })

    expect(data?.items.map(({ type }) => type)).toEqual(['team.invited', 'invite_link.created', 'course.completed'])
    expect(data?.hasMore).toBe(true)
  })

  it('filters by category and unread state', async () => {
    const { client, ids, inbox, schema } = context
    const organization = await inbox.listNotifications({ category: 'organization' })
    expect(organization.data?.items.map(({ type }) => type)).toEqual(['invite_link.created'])

    await client.db
      .update(schema.notifications)
      .set({ readAt: new Date().toISOString() })
      .where(and(eq(schema.notifications.userId, ids.volunteer), eq(schema.notifications.type, 'team.invited')))
    const unread = await inbox.listNotifications({ filter: 'unread' })
    expect(unread.data?.items).toHaveLength(3)
    expect(unread.data?.items.every(({ read }) => !read)).toBe(true)
  })

  it('counts and marks only the signed-in user rows', async () => {
    const { client, ids, inbox, schema } = context
    expect((await inbox.countUnreadNotifications()).data).toBe(4)

    const [first] = (await inbox.listNotifications()).data?.items ?? []
    await inbox.markNotificationRead(first?.id ?? 0)
    expect((await inbox.countUnreadNotifications()).data).toBe(3)

    const [foreign] = await client.db.query.notifications.findMany({
      where: eq(schema.notifications.userId, ids.tutor),
    })
    await inbox.markNotificationRead(foreign?.id ?? 0)
    const after = await client.db.query.notifications.findFirst({
      where: eq(schema.notifications.id, foreign?.id ?? 0),
    })
    expect(after?.readAt).toBeNull()

    expect((await inbox.markAllNotificationsRead()).data).toBe(3)
    expect((await inbox.countUnreadNotifications()).data).toBe(0)
    const stillUnread = await client.db.query.notifications.findFirst({
      where: and(eq(schema.notifications.userId, ids.tutor), eq(schema.notifications.type, 'certificate.approved')),
    })
    expect(stillUnread?.readAt).toBeNull()
  })

  it('rejects anonymous callers and bad filters', async () => {
    authUser.current = null
    expect((await context.inbox.listNotifications()).error?.code).toBe('UNAUTHORIZED')
    expect((await context.inbox.markAllNotificationsRead()).error?.code).toBe('UNAUTHORIZED')

    authUser.current = { id: context.ids.volunteer }
    expect((await context.inbox.listNotifications({ limit: 5000 })).error?.code).toBe('INVALID_INPUT')
  })
})
