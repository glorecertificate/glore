import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const userId = `onboarding-${suffix}`

const values = {
  birthPlace: 'Milan, Italy',
  birthday: '1999-04-12',
  firstName: 'Jane',
  lastName: 'Doe',
  locale: 'it',
  name: 'Jane Doe',
  nationality: 'it',
  phone: null,
  username: `jane.doe.${suffix}`,
}

describe.skipIf(!isLocalDatabase)('completeOnboardingProfile', () => {
  let context: {
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/user')
    schema: typeof import('@/db/schema')
  }

  beforeAll(async () => {
    const [client, mutations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/user'),
      import('@/db/schema'),
    ])
    context = { client, mutations, schema }
    await client.db.insert(schema.users).values({
      email: `${userId}@onboarding.test`,
      emailVerified: true,
      firstName: '',
      id: userId,
      name: '',
    })
  })

  afterAll(async () => {
    await context.client.db.delete(context.schema.users).where(eq(context.schema.users.id, userId))
  })

  it('stores the profile once and marks the user onboarded', async () => {
    const { client, mutations, schema } = context
    const first = await client.transaction(tx => mutations.completeOnboardingProfile(tx, userId, values))
    expect(first).toEqual({ id: userId })

    const user = await client.db.query.users.findFirst({ where: eq(schema.users.id, userId) })
    expect(user).toMatchObject({
      birthPlace: 'Milan, Italy',
      birthday: '1999-04-12',
      firstName: 'Jane',
      lastName: 'Doe',
      name: 'Jane Doe',
      nationality: 'it',
      phone: null,
      username: values.username,
    })
    expect(user?.onboardedAt).toBeTruthy()

    const second = await client.transaction(tx =>
      mutations.completeOnboardingProfile(tx, userId, { ...values, firstName: 'Changed' })
    )
    expect(second).toBeNull()
    const again = await client.db.query.users.findFirst({ where: eq(schema.users.id, userId) })
    expect(again?.firstName).toBe('Jane')
  })
})
