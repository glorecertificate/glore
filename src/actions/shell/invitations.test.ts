import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { type Fixture, createFixture, isLocalDatabase } from '@/actions/certificates/test-harness'
import { hashToken } from '@/lib/secret-token'

const viewer = vi.hoisted(() => ({ current: null as { email: string; id: string } | null }))

vi.mock('next/cache', async () => (await import('@/actions/certificates/test-harness')).mocks.cache)
vi.mock('@/actions/user', () => ({
  getCurrentUser: async () => {
    const [{ db }, { eq: equals }, { memberships }] = await Promise.all([
      import('@/db/client'),
      import('drizzle-orm'),
      import('@/db/schema'),
    ])
    if (!viewer.current) throw new Error('Not authenticated')
    const rows = await db
      .select({ id: memberships.organizationId, role: memberships.role })
      .from(memberships)
      .where(equals(memberships.userId, viewer.current.id))
    return { ...viewer.current, organizations: rows }
  },
}))

describe.skipIf(!isLocalDatabase)('pending invitations', () => {
  let fixture: Fixture
  let invitations: typeof import('@/actions/shell/invitations')

  beforeAll(async () => {
    fixture = await createFixture()
    invitations = await import('@/actions/shell/invitations')
  })

  afterAll(async () => {
    await fixture.db
      .delete(fixture.schema.organizationInvitations)
      .where(
        inArray(fixture.schema.organizationInvitations.organizationId, [
          fixture.organizationId,
          fixture.otherOrganizationId,
        ])
      )
    await fixture.cleanup()
  })

  it('lists open invitations for the viewer only, by account or email', async () => {
    const { db, schema } = fixture
    const email = `outsider-${fixture.ids.outsider.split('-')[2]}@lane-a.test`
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const past = new Date(Date.now() - 86_400_000).toISOString()
    const base = { organizationId: fixture.otherOrganizationId, role: 'volunteer' as const }
    const pendingIds = async () => {
      const { data } = await invitations.listMyPendingInvitations()
      return data?.map(({ id }) => id) ?? []
    }
    const insert = async (
      values: Omit<typeof schema.organizationInvitations.$inferInsert, 'tokenHash'>,
      token: string
    ) => {
      const [row] = await db
        .insert(schema.organizationInvitations)
        .values({ ...values, tokenHash: hashToken(token) })
        .returning({ id: schema.organizationInvitations.id })
      return row!.id
    }
    const clear = async () =>
      await db
        .delete(schema.organizationInvitations)
        .where(eq(schema.organizationInvitations.organizationId, fixture.otherOrganizationId))
    viewer.current = { email, id: fixture.ids.outsider }

    const open = await insert({ ...base, email, expiresAt: future }, 'open')
    expect(await pendingIds()).toEqual([open])
    const { data } = await invitations.listMyPendingInvitations()
    expect(Object.keys(data?.[0] ?? {}).filter(key => key.startsWith('token'))).toEqual([])
    await clear()

    const foreign = await insert({ ...base, email: 'x@lane-a.test', expiresAt: future }, 'foreign')
    expect(await pendingIds()).toEqual([])
    await db
      .update(schema.organizationInvitations)
      .set({ userId: fixture.ids.outsider })
      .where(eq(schema.organizationInvitations.id, foreign))
    expect(await pendingIds()).toEqual([foreign])
    await clear()

    for (const [token, state] of [
      ['expired', { expiresAt: past }],
      ['revoked', { expiresAt: future, revokedAt: past }],
      ['declined', { declinedAt: past, expiresAt: future }],
      ['accepted', { acceptedAt: past, expiresAt: future }],
    ] as const) {
      await insert({ ...base, ...state, email }, token)
      expect(await pendingIds()).toEqual([])
      await clear()
    }
  })

  it('hides invitations of organizations the viewer already belongs to', async () => {
    const { db, schema } = fixture
    const email = `author-${fixture.ids.author.split('-')[2]}@lane-a.test`
    await db.insert(schema.organizationInvitations).values({
      email,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      organizationId: fixture.organizationId,
      role: 'volunteer',
      tokenHash: hashToken(`${fixture.ids.author}-member`),
    })
    viewer.current = { email, id: fixture.ids.author }
    const { data } = await invitations.listMyPendingInvitations()
    expect(data).toEqual([])
  })
})
