import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SEED_ORG_HANDLE, seedEmail } from '~/scripts/seed-data'

const isLocalDatabase = /@(localhost|127\.0\.0\.1)(:|\/)/u.test(process.env.DATABASE_URL ?? '')

const activity = {
  activityDescription: 'Integration test activity',
  activityDuration: 10,
  activityEndDate: '2026-02-01',
  activityLocation: 'Milan',
  activityStartDate: '2026-01-01',
  language: 'en',
}

describe.skipIf(!isLocalDatabase)('createCertificateWithSkills', () => {
  let context: {
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/certificate')
    schema: typeof import('@/db/schema')
    organizationId: number
    userId: string
  }

  const cleanup = async () => {
    const { client, organizationId, schema, userId } = context
    const owned = and(eq(schema.certificates.userId, userId), eq(schema.certificates.organizationId, organizationId))
    const rows = await client.db.select({ id: schema.certificates.id }).from(schema.certificates).where(owned)
    const ids = rows.map(({ id }) => id)
    if (ids.length === 0) return
    await client.db.delete(schema.certificateSkills).where(inArray(schema.certificateSkills.certificateId, ids))
    await client.db.delete(schema.certificates).where(inArray(schema.certificates.id, ids))
  }

  beforeAll(async () => {
    const [client, mutations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/certificate'),
      import('@/db/schema'),
    ])
    const [user, organization] = await Promise.all([
      client.db.query.users.findFirst({ columns: { id: true }, where: eq(schema.users.email, seedEmail('volunteer')) }),
      client.db.query.organizations.findFirst({
        columns: { id: true },
        where: eq(schema.organizations.handle, SEED_ORG_HANDLE),
      }),
    ])
    if (!(user && organization)) throw new Error('Run pnpm run db:seed first')
    context = { client, mutations, organizationId: organization.id, schema, userId: user.id }
    await cleanup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('creates one non-draft certificate when two requests race', async () => {
    const { client, mutations, organizationId, userId } = context
    const create = (suffix: string) =>
      client.transaction(tx =>
        mutations.createCertificateWithSkills(
          tx,
          { ...activity, handle: `test-${userId}-${suffix}`, organizationId, status: 'submitted', userId },
          { skillCourseIds: [] }
        )
      )

    const results = await Promise.allSettled([create('a'), create('b')])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)
  })
})
