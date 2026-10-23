import { randomUUID } from 'node:crypto'

import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const state = vi.hoisted(() => ({ failEvent: false, userId: '' }))

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  },
  unstable_rethrow: () => undefined,
}))
vi.mock('@/actions/auth', () => ({
  getAuthUser: () => Promise.resolve({ id: state.userId }),
  refreshAuthSession: vi.fn(() => Promise.resolve()),
}))
vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))
vi.mock('@/db/mutations/activity-event', async importOriginal => {
  const original = await importOriginal<typeof import('@/db/mutations/activity-event')>()
  return {
    ...original,
    recordEvent: (...args: Parameters<typeof original.recordEvent>) => {
      if (state.failEvent) return Promise.reject(new Error('event store down'))
      return original.recordEvent(...args)
    },
  }
})

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const OLD_PASSWORD = 'OldPassword1!'

const values = (overrides: Record<string, string> = {}) => ({
  birthPlace: 'Milan',
  birthday: '1999-04-12',
  firstName: 'Jane',
  lastName: 'Onboarding',
  nationality: 'it',
  password: 'NewPassword1!',
  phone: '',
  termsAccepted: true,
  ...overrides,
})

describe.skipIf(!isLocalDatabase)('completeOnboarding', () => {
  const suffix = randomUUID().slice(0, 8)
  let context: {
    actions: typeof import('@/actions/onboarding')
    auth: typeof import('@/lib/auth')
    client: typeof import('@/db/client')
    schema: typeof import('@/db/schema')
  }

  const verify = async (password: string) => {
    const { auth, client, schema } = context
    const rows = await client.db.query.accounts.findMany({
      where: and(eq(schema.accounts.userId, state.userId), eq(schema.accounts.providerId, 'credential')),
    })
    const { password: engine } = await auth.auth.$context
    const hashes = rows.flatMap(({ password: hash }) => (hash ? [hash] : []))
    const matches = await Promise.all(hashes.map(hash => engine.verify({ hash, password })))
    return matches.some(Boolean)
  }

  const credentialCount = async () =>
    (
      await context.client.db.query.accounts.findMany({
        where: and(
          eq(context.schema.accounts.userId, state.userId),
          eq(context.schema.accounts.providerId, 'credential')
        ),
      })
    ).length

  const reset = async ({ withCredential = true } = {}) => {
    const { auth, client, schema } = context
    await client.db.delete(schema.accounts).where(eq(schema.accounts.userId, state.userId))
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.subjectId, state.userId))
    await client.db.update(schema.users).set({ onboardedAt: null }).where(eq(schema.users.id, state.userId))
    if (!withCredential) return
    const { password } = await auth.auth.$context
    const now = new Date().toISOString()
    await client.db.insert(schema.accounts).values({
      accountId: state.userId,
      createdAt: now,
      id: randomUUID(),
      password: await password.hash(OLD_PASSWORD),
      providerId: 'credential',
      updatedAt: now,
      userId: state.userId,
    })
  }

  beforeAll(async () => {
    const [actions, auth, client, schema] = await Promise.all([
      import('@/actions/onboarding'),
      import('@/lib/auth'),
      import('@/db/client'),
      import('@/db/schema'),
    ])
    context = { actions, auth, client, schema }
    state.userId = `onboarding-action-${suffix}`
    await client.db.insert(schema.users).values({
      email: `${state.userId}@onboarding-action.test`,
      emailVerified: true,
      firstName: '',
      id: state.userId,
      name: '',
    })
  })

  beforeEach(async () => {
    state.failEvent = false
    await reset()
  })

  afterAll(async () => {
    await context.client.db
      .delete(context.schema.activityEvents)
      .where(eq(context.schema.activityEvents.subjectId, state.userId))
    await context.client.db.delete(context.schema.users).where(eq(context.schema.users.id, state.userId))
  })

  it('sets the chosen password together with the profile', async () => {
    const { data, error } = await context.actions.completeOnboarding(values())

    expect(error).toBeNull()
    expect(data?.username).toBeTruthy()
    expect(await verify('NewPassword1!')).toBe(true)
    expect(await verify(OLD_PASSWORD)).toBe(false)
    expect(await credentialCount()).toBe(1)
  })

  it('creates the credential when the account has none', async () => {
    await reset({ withCredential: false })

    expect((await context.actions.completeOnboarding(values())).error).toBeNull()

    expect(await verify('NewPassword1!')).toBe(true)
    expect(await credentialCount()).toBe(1)
  })

  it('keeps the previous password when the onboarding transaction fails', async () => {
    state.failEvent = true

    const { error } = await context.actions.completeOnboarding(values())

    expect(error).toEqual({ code: 'FAILED' })
    expect(await verify(OLD_PASSWORD)).toBe(true)
    expect(await verify('NewPassword1!')).toBe(false)
    const user = await context.client.db.query.users.findFirst({ where: eq(context.schema.users.id, state.userId) })
    expect(user?.onboardedAt).toBeNull()
  })

  it('keeps the password of an account that is already onboarded', async () => {
    await context.client.db
      .update(context.schema.users)
      .set({ onboardedAt: new Date().toISOString() })
      .where(eq(context.schema.users.id, state.userId))

    const { error } = await context.actions.completeOnboarding(values())

    expect(error).toEqual({ code: 'ALREADY_ONBOARDED' })
    expect(await verify(OLD_PASSWORD)).toBe(true)
  })

  it('lets only one of two simultaneous submissions set the password', async () => {
    const results = await Promise.all([
      context.actions.completeOnboarding(values({ password: 'FirstPassword1!' })),
      context.actions.completeOnboarding(values({ password: 'SecondPassword1!' })),
    ])

    const winners = results.flatMap(({ error }, index) => (error ? [] : [index]))
    expect(winners).toHaveLength(1)
    const winning = winners[0] === 0 ? 'FirstPassword1!' : 'SecondPassword1!'
    const losing = winners[0] === 0 ? 'SecondPassword1!' : 'FirstPassword1!'
    expect(await verify(winning)).toBe(true)
    expect(await verify(losing)).toBe(false)
  })
})
