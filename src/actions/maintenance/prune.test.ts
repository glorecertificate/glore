import { inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_DATABASE_REGEX, seedEmail } from '~/scripts/seed-data'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const NOW = new Date('2001-06-01T00:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const at = (days: number) => new Date(NOW.getTime() + days * DAY).toISOString()

const TOKENS = ['prune-expired', 'prune-fresh', 'prune-accepted', 'prune-old-revoked']
const SESSIONS = ['prune-session-old', 'prune-session-live']
const VERIFICATIONS = ['prune-verification-old', 'prune-verification-live']

describe.skipIf(!isLocalDatabase)('pruneExpiredRecords', () => {
  let context: {
    client: typeof import('@/db/client')
    prune: typeof import('@/actions/maintenance/prune')
    schema: typeof import('@/db/schema')
  }

  const cleanup = async () => {
    const { client, schema } = context
    await Promise.all([
      client.db.delete(schema.organizationInvitations).where(inArray(schema.organizationInvitations.token, TOKENS)),
      client.db.delete(schema.sessions).where(inArray(schema.sessions.id, SESSIONS)),
      client.db.delete(schema.verifications).where(inArray(schema.verifications.id, VERIFICATIONS)),
    ])
  }

  beforeAll(async () => {
    const [client, prune, schema] = await Promise.all([
      import('@/db/client'),
      import('@/actions/maintenance/prune'),
      import('@/db/schema'),
    ])
    context = { client, prune, schema }
    await cleanup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('removes only stale invitations, sessions and verifications', async () => {
    const { client, prune, schema } = context
    const organization = await client.db.query.organizations.findFirst({ columns: { id: true } })
    const user = await client.db.query.users.findFirst({
      columns: { id: true },
      where: inArray(schema.users.email, [seedEmail('learner')]),
    })
    if (!(organization && user)) throw new Error('Run pnpm run db:seed first')

    const base = { organizationId: organization.id, role: 'volunteer' as const }
    await client.db.insert(schema.organizationInvitations).values([
      { ...base, email: 'prune-expired@example.com', expiresAt: at(-60), token: 'prune-expired' },
      { ...base, email: 'prune-fresh@example.com', expiresAt: at(-5), token: 'prune-fresh' },
      {
        ...base,
        acceptedAt: at(-70),
        email: 'prune-accepted@example.com',
        expiresAt: at(-60),
        token: 'prune-accepted',
      },
      {
        ...base,
        email: 'prune-old-revoked@example.com',
        expiresAt: at(30),
        revokedAt: at(-40),
        token: 'prune-old-revoked',
      },
    ])
    await client.db.insert(schema.sessions).values([
      { createdAt: at(-9), expiresAt: at(-2), id: SESSIONS[0], token: SESSIONS[0], updatedAt: at(-9), userId: user.id },
      { createdAt: at(-1), expiresAt: at(5), id: SESSIONS[1], token: SESSIONS[1], updatedAt: at(-1), userId: user.id },
    ])
    await client.db.insert(schema.verifications).values([
      { expiresAt: at(-1), id: VERIFICATIONS[0], identifier: 'prune-old', value: 'x' },
      { expiresAt: at(1), id: VERIFICATIONS[1], identifier: 'prune-live', value: 'x' },
    ])

    const result = await prune.pruneExpiredRecords(NOW)
    expect(result.invitations).toBeGreaterThanOrEqual(2)
    expect(result.sessions).toBeGreaterThanOrEqual(1)
    expect(result.verifications).toBeGreaterThanOrEqual(1)

    const [invitations, sessions, verifications] = await Promise.all([
      client.db.query.organizationInvitations.findMany({
        columns: { token: true },
        where: inArray(schema.organizationInvitations.token, TOKENS),
      }),
      client.db.query.sessions.findMany({ columns: { id: true }, where: inArray(schema.sessions.id, SESSIONS) }),
      client.db.query.verifications.findMany({
        columns: { id: true },
        where: inArray(schema.verifications.id, VERIFICATIONS),
      }),
    ])
    expect(invitations.map(({ token }) => token).toSorted()).toEqual(['prune-accepted', 'prune-fresh'])
    expect(sessions.map(({ id }) => id)).toEqual(['prune-session-live'])
    expect(verifications.map(({ id }) => id)).toEqual(['prune-verification-live'])
  })
})
