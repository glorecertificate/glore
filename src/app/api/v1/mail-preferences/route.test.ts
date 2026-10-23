import { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX, seedEmail } from '~/scripts/seed-data'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: () => Promise.resolve(false),
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('mail preferences route', () => {
  let context: {
    client: typeof import('@/db/client')
    route: typeof import('@/app/api/v1/mail-preferences/route')
    schema: typeof import('@/db/schema')
    unsubscribe: typeof import('@/lib/unsubscribe')
    userId: string
  }

  const request = (path: string, method = 'POST') => new NextRequest(`https://glore.test${path}`, { method })

  beforeAll(async () => {
    const [client, route, schema, unsubscribe] = await Promise.all([
      import('@/db/client'),
      import('@/app/api/v1/mail-preferences/route'),
      import('@/db/schema'),
      import('@/lib/unsubscribe'),
    ])
    const user = await client.db.query.users.findFirst({
      columns: { id: true },
      where: eq(schema.users.email, seedEmail('learner')),
    })
    if (!user) throw new Error('Run pnpm run db:seed first')
    context = { client, route, schema, unsubscribe, userId: user.id }
    await client.db
      .update(schema.users)
      .set({ notificationPreferences: { organization: false } })
      .where(eq(schema.users.id, user.id))
  })

  beforeEach(() => {
    vi.stubEnv('APP_URL', 'https://glore.test')
    vi.stubEnv('BETTER_AUTH_SECRET', 'c'.repeat(43).concat('='))
  })

  afterAll(async () => {
    const { client, schema, userId } = context
    await client.db.update(schema.users).set({ notificationPreferences: {} }).where(eq(schema.users.id, userId))
  })

  it('turns a category off from the one-click POST and keeps the others', async () => {
    const { client, route, schema, unsubscribe, userId } = context
    const url = new URL(unsubscribe.unsubscribeUrl(userId, 'reminders'))
    const response = await route.POST(request(`${url.pathname}${url.search}`) as never)
    const user = await client.db.query.users.findFirst({
      columns: { notificationPreferences: true },
      where: eq(schema.users.id, userId),
    })

    expect(response.status).toBe(200)
    expect(user?.notificationPreferences).toEqual({ organization: false, reminders: false })
  })

  it('rejects a forged token and never changes anything', async () => {
    const { route, userId } = context
    const response = await route.POST(request(`/api/v1/mail-preferences?token=${userId}.learning.forged`) as never)

    expect(response.status).toBe(400)
  })

  it('sends a plain GET to the settings page on the app host without changing anything', () => {
    const response = context.route.GET()

    expect(response.headers.get('location')).toBe('https://glore.test/settings?tab=notifications')
  })
})
