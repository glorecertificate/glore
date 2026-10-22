import { randomUUID } from 'node:crypto'

import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const email = (name: string) => `${name}-${suffix}@roles.test`

type Key = 'holder' | 'newOwner' | 'owner' | 'pending' | 'tutor' | 'volunteer'

describe.skipIf(!isLocalDatabase)('member roles, tutor release, and ownership transfer', () => {
  let context: {
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/organization')
    schema: typeof import('@/db/schema')
    ids: Record<Key, string>
    organizationId: number
  }

  const run = <T>(fn: (tx: Parameters<Parameters<typeof context.client.transaction>[0]>[0]) => Promise<T>) =>
    context.client.transaction(fn)

  const membershipOf = async (userId: string) =>
    await context.client.db.query.memberships.findFirst({
      where: and(
        eq(context.schema.memberships.organizationId, context.organizationId),
        eq(context.schema.memberships.userId, userId)
      ),
    })

  const requireMembership = async (userId: string) => {
    const membership = await membershipOf(userId)
    if (!membership) throw new Error('Missing membership')
    return membership
  }

  const insertCertificate = async (status: 'approved' | 'changes_requested' | 'in_review' | 'submitted') => {
    const [row] = await context.client.db
      .insert(context.schema.certificates)
      .values({
        activityDescription: 'Test',
        activityDuration: 120,
        activityEndDate: '2026-06-30',
        activityLocation: 'Milan',
        activityStartDate: '2026-01-10',
        handle: `roles-${randomUUID()}`,
        language: 'en',
        organizationId: context.organizationId,
        reviewerId: context.ids.tutor,
        status,
        userId: context.ids.holder,
      })
      .returning({ id: context.schema.certificates.id })
    if (!row) throw new Error('Failed to create a certificate')
    return row.id
  }

  const certificate = async (id: number) =>
    await context.client.db.query.certificates.findFirst({ where: eq(context.schema.certificates.id, id) })

  const rejection = async (promise: Promise<unknown>) => {
    try {
      await promise
    } catch (error) {
      return error as Error & { code?: string }
    }
    throw new Error('Expected a rejection')
  }

  beforeAll(async () => {
    const [client, mutations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/organization'),
      import('@/db/schema'),
    ])
    const ids = {
      holder: randomUUID(),
      newOwner: randomUUID(),
      owner: randomUUID(),
      pending: randomUUID(),
      tutor: randomUUID(),
      volunteer: randomUUID(),
    }
    for (const [key, id] of Object.entries(ids)) {
      await client.db.insert(schema.users).values({
        email: email(key),
        firstName: key,
        id,
        name: key,
        onboardedAt: key === 'pending' ? null : new Date().toISOString(),
      })
    }
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: email('org'),
        handle: `roles-test-${suffix}`,
        name: 'Roles Test',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    context = { client, ids, mutations, organizationId: organization.id, schema }
  })

  beforeEach(async () => {
    const { client, ids, organizationId, schema } = context
    await client.db.delete(schema.certificates).where(eq(schema.certificates.organizationId, organizationId))
    await client.db.delete(schema.memberships).where(eq(schema.memberships.organizationId, organizationId))
    await client.db.insert(schema.memberships).values([
      { organizationId, role: 'admin', userId: ids.owner },
      { organizationId, role: 'representative', userId: ids.newOwner },
      { organizationId, role: 'representative', userId: ids.pending },
      { organizationId, role: 'tutor', userId: ids.tutor },
      { organizationId, role: 'volunteer', userId: ids.holder },
      { organizationId, role: 'volunteer', userId: ids.volunteer },
    ])
  })

  afterAll(async () => {
    const { client, ids, organizationId, schema } = context
    await client.db.delete(schema.certificates).where(eq(schema.certificates.organizationId, organizationId))
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, organizationId))
    await client.db.delete(schema.organizations).where(eq(schema.organizations.id, organizationId))
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
  })

  describe('changeMemberRole', () => {
    const change = async (
      userId: string,
      role: Parameters<typeof context.mutations.changeMemberRole>[1]['role'],
      actor = context.ids.owner
    ) =>
      await run(async tx =>
        context.mutations.changeMemberRole(tx, {
          actorId: actor,
          membershipId: (await requireMembership(userId)).id,
          organizationId: context.organizationId,
          role,
        })
      )

    it('changes the role and records the event', async () => {
      const result = await change(context.ids.volunteer, 'tutor')

      expect(result.previousRole).toBe('volunteer')
      expect((await requireMembership(context.ids.volunteer)).role).toBe('tutor')
      const events = await context.client.db.query.activityEvents.findMany({
        where: and(
          eq(context.schema.activityEvents.organizationId, context.organizationId),
          eq(context.schema.activityEvents.action, 'member.role_changed')
        ),
      })
      expect(events).toHaveLength(1)
      expect(events[0]?.metadata).toMatchObject({ previousRole: 'volunteer', role: 'tutor' })
    })

    it('refuses the owner role, the owner as target, yourself, and a no-op', async () => {
      expect((await rejection(change(context.ids.volunteer, 'admin'))).code).toBe('OWNER_ROLE')
      expect((await rejection(change(context.ids.owner, 'tutor', context.ids.newOwner))).code).toBe('OWNER_ROLE')
      expect((await rejection(change(context.ids.newOwner, 'tutor', context.ids.newOwner))).code).toBe('SELF')
      expect((await rejection(change(context.ids.volunteer, 'volunteer'))).code).toBe('INVALID')
      expect((await requireMembership(context.ids.owner)).role).toBe('admin')
    })

    it('rejects a membership of another organization', async () => {
      const error = await rejection(
        run(tx =>
          context.mutations.changeMemberRole(tx, {
            actorId: context.ids.owner,
            membershipId: 2_147_483_000,
            organizationId: context.organizationId,
            role: 'tutor',
          })
        )
      )
      expect(error.code).toBe('NOT_FOUND')
    })

    it('sends the open reviews of a demoted tutor back to the pool and keeps finished ones', async () => {
      const inReview = await insertCertificate('in_review')
      const changes = await insertCertificate('changes_requested')
      const approved = await insertCertificate('approved')

      const { events } = await change(context.ids.tutor, 'volunteer')

      expect(events.filter(({ type }) => type === 'certificate.unassigned')).toHaveLength(2)
      expect(await certificate(inReview)).toMatchObject({ reviewerId: null, status: 'submitted' })
      expect(await certificate(changes)).toMatchObject({ reviewerId: null, status: 'changes_requested' })
      expect(await certificate(approved)).toMatchObject({ reviewerId: context.ids.tutor, status: 'approved' })
    })
  })

  describe('removeMembership', () => {
    const remove = async (userId: string, kind?: 'left' | 'removed') =>
      await run(async tx =>
        context.mutations.removeMembership(tx, {
          actorId: userId === context.ids.owner ? context.ids.newOwner : context.ids.owner,
          kind,
          membershipId: (await requireMembership(userId)).id,
          organizationId: context.organizationId,
        })
      )

    it('releases the open assignments of a removed tutor', async () => {
      const submitted = await insertCertificate('submitted')
      const approved = await insertCertificate('approved')

      const { events } = await remove(context.ids.tutor)

      expect(events.map(({ type }) => type)).toEqual(['certificate.unassigned', 'member.removed'])
      expect(await membershipOf(context.ids.tutor)).toBeUndefined()
      expect(await certificate(submitted)).toMatchObject({ reviewerId: null, status: 'submitted' })
      expect(await certificate(approved)).toMatchObject({ reviewerId: context.ids.tutor })
    })

    it('records a leave as member.left', async () => {
      const { events } = await remove(context.ids.volunteer, 'left')

      expect(events.map(({ type }) => type)).toEqual(['member.left'])
      expect(await membershipOf(context.ids.volunteer)).toBeUndefined()
    })

    it('never removes the only owner', async () => {
      const error = await rejection(remove(context.ids.owner, 'left'))

      expect(error.code).toBe('LAST_OWNER')
      expect(await membershipOf(context.ids.owner)).toBeDefined()
    })
  })

  describe('transferOwnership', () => {
    const transfer = async (userId: string, actor = context.ids.owner) =>
      await run(async tx =>
        context.mutations.transferOwnership(tx, {
          actorId: actor,
          newOwnerMembershipId: (await requireMembership(userId)).id,
          organizationId: context.organizationId,
        })
      )

    it('swaps the roles and records one event', async () => {
      const { event } = await transfer(context.ids.newOwner)

      expect(event.data).toEqual({ newOwnerId: context.ids.newOwner, previousOwnerId: context.ids.owner })
      expect((await requireMembership(context.ids.newOwner)).role).toBe('admin')
      expect((await requireMembership(context.ids.owner)).role).toBe('representative')
      const owners = await context.client.db.query.memberships.findMany({
        where: and(
          eq(context.schema.memberships.organizationId, context.organizationId),
          eq(context.schema.memberships.role, 'admin')
        ),
      })
      expect(owners).toHaveLength(1)
    })

    it('needs a representative who finished onboarding', async () => {
      expect((await rejection(transfer(context.ids.volunteer))).code).toBe('NOT_ELIGIBLE')
      expect((await rejection(transfer(context.ids.pending))).code).toBe('NOT_ELIGIBLE')
      expect((await requireMembership(context.ids.owner)).role).toBe('admin')
    })

    it('needs the current owner as the actor and another member as the target', async () => {
      expect((await rejection(transfer(context.ids.newOwner, context.ids.newOwner))).code).toBe('FORBIDDEN')
      expect((await rejection(transfer(context.ids.owner))).code).toBe('SELF')
      expect((await requireMembership(context.ids.owner)).role).toBe('admin')
    })
  })
})
