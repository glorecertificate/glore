import { randomUUID } from 'node:crypto'

import { eq, inArray, or } from 'drizzle-orm'

import { Jar } from '@/lib/test-jar'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

export const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const PASSWORD = 'Password1!'
export const DAY = 24 * 60 * 60 * 1000

interface FixtureOptions<K extends string> {
  admins?: readonly K[]
  editors?: readonly K[]
  pending?: readonly K[]
}

export const createAdminFixture = async <K extends string>(
  keys: readonly K[],
  { admins = [], editors = [], pending = [] }: FixtureOptions<K> = {}
) => {
  const suffix = randomUUID().slice(0, 8)
  const [{ auth }, client, schema] = await Promise.all([
    import('@/lib/auth'),
    import('@/db/client'),
    import('@/db/schema'),
  ])
  const { db } = client
  const emails = Object.fromEntries(keys.map(key => [key, `${key}-${suffix}@admin-lane.test`])) as Record<K, string>
  const ids = {} as Record<K, string>
  const jars = {} as Record<K, Jar>

  await Promise.all(
    keys.map(async key => {
      const created = await auth.api.signUpEmail({
        body: { email: emails[key], firstName: key, name: key, password: PASSWORD },
      })
      ids[key] = created.user.id
    })
  )

  const onboarded = keys.flatMap(key => (pending.includes(key) ? [] : [ids[key]]))
  if (onboarded.length > 0) {
    await db
      .update(schema.users)
      .set({ onboardedAt: new Date().toISOString() })
      .where(inArray(schema.users.id, onboarded))
  }
  if (admins.length > 0) {
    await db
      .update(schema.users)
      .set({ role: 'admin' })
      .where(
        inArray(
          schema.users.id,
          admins.map(key => ids[key])
        )
      )
  }
  if (editors.length > 0) {
    await db
      .update(schema.users)
      .set({ isEditor: true })
      .where(
        inArray(
          schema.users.id,
          editors.map(key => ids[key])
        )
      )
  }

  const signIn = async (key: K) => {
    const jar = new Jar()
    const result = await auth.api.signInEmail({
      body: { email: emails[key], password: PASSWORD },
      returnHeaders: true,
    })
    jar.apply(result.headers)
    jars[key] = jar
    return jar
  }

  const cleanup = async () => {
    const userIds = Object.values(ids) as string[]
    await db
      .delete(schema.activityEvents)
      .where(or(inArray(schema.activityEvents.actorId, userIds), inArray(schema.activityEvents.subjectId, userIds)))
    await db.delete(schema.users).where(inArray(schema.users.id, userIds))
  }

  const findUser = async (key: K) => {
    const row = await db.query.users.findFirst({ where: eq(schema.users.id, ids[key]) })
    if (!row) throw new Error('User disappeared')
    return row
  }

  return { auth, cleanup, client, emails, findUser, ids, jars, schema, signIn, suffix }
}
