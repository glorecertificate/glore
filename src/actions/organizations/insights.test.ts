import { randomUUID } from 'node:crypto'

import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { hashToken } from '@/lib/secret-token'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const access = vi.hoisted(() => ({ organizationId: 0, role: 'admin' as string }))

vi.mock('@/actions/organizations/helpers', () => ({
  getOrganizationAccess: () =>
    Promise.resolve({
      organizationId: access.organizationId,
      platform: false,
      role: access.role,
      user: { id: 'test' },
    }),
  reviewerColumns: { email: true, firstName: true, id: true, lastName: true },
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('organization insights and activity', () => {
  const suffix = randomUUID().slice(0, 8)
  const ids = { holder: randomUUID(), owner: randomUUID(), tutor: randomUUID() }
  let context: {
    client: typeof import('@/db/client')
    schema: typeof import('@/db/schema')
  }

  const certificate = (status: 'approved' | 'in_review', index: number, extra: Record<string, unknown> = {}) => ({
    activityDescription: 'Test',
    activityDuration: 120,
    activityEndDate: '2026-06-30',
    activityLocation: 'Milan',
    activityStartDate: '2026-01-10',
    handle: `insights-${suffix}-${index}`,
    language: 'en',
    organizationId: access.organizationId,
    reviewerId: ids.tutor,
    status,
    userId: ids.holder,
    ...extra,
  })

  beforeAll(async () => {
    const [client, schema] = await Promise.all([import('@/db/client'), import('@/db/schema')])
    for (const [key, id] of Object.entries(ids)) {
      await client.db.insert(schema.users).values({
        email: `${key}-${suffix}@insights.test`,
        firstName: key,
        id,
        name: key,
        onboardedAt: new Date().toISOString(),
      })
    }
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: `org-${suffix}@insights.test`,
        handle: `insights-test-${suffix}`,
        name: 'Insights Test',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    access.organizationId = organization.id
    await client.db.insert(schema.memberships).values([
      { organizationId: organization.id, role: 'admin', userId: ids.owner },
      { organizationId: organization.id, role: 'tutor', userId: ids.tutor },
      { organizationId: organization.id, role: 'volunteer', userId: ids.holder },
    ])
    const now = new Date()
    const earlier = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    await client.db.insert(schema.certificates).values([
      certificate('approved', 1, {
        issuedAt: now.toISOString(),
        reviewedAt: now.toISOString(),
        submittedAt: earlier,
      }),
      certificate('in_review', 2, { submittedAt: now.toISOString() }),
    ])
    await client.db.insert(schema.activityEvents).values([
      {
        action: 'member.joined',
        actorId: ids.owner,
        metadata: { role: 'volunteer', userId: ids.holder },
        organizationId: organization.id,
        subjectId: ids.holder,
        subjectType: 'user',
      },
      {
        action: 'certificate.approved',
        actorId: ids.tutor,
        metadata: { holderId: ids.holder, tutorId: ids.tutor },
        organizationId: organization.id,
        subjectId: '1',
        subjectType: 'certificate',
      },
    ])
    context = { client, schema }
  })

  afterAll(async () => {
    const { client, schema } = context
    await client.db.delete(schema.certificates).where(eq(schema.certificates.organizationId, access.organizationId))
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, access.organizationId))
    await client.db.delete(schema.organizations).where(eq(schema.organizations.id, access.organizationId))
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
  })

  it('aggregates months, review time, workload, and learning, hiding ratings below three', async () => {
    access.role = 'representative'
    const { getOrganizationInsights } = await import('@/actions/organizations/insights')
    const { data, error } = await getOrganizationInsights()
    expect(error).toBeNull()
    expect(data?.monthly).toHaveLength(12)
    expect(data?.monthly.at(-1)).toMatchObject({ approved: 1, submitted: 2 })
    expect(data?.review.sample).toBe(1)
    expect(Math.round(data?.review.averageHours ?? 0)).toBe(72)
    expect(data?.tutors).toEqual([expect.objectContaining({ name: 'tutor', open: 1, reviewed: 1 })])
    expect(data?.learning.people).toBe(1)
    expect(data?.rating).toEqual({ count: 0, ready: false })
  })

  it('refuses insights and activity to non managers', async () => {
    access.role = 'volunteer'
    const [{ getOrganizationInsights }, { getOrganizationActivity }] = await Promise.all([
      import('@/actions/organizations/insights'),
      import('@/actions/organizations/activity'),
    ])
    expect((await getOrganizationInsights()).error?.code).toBe('FORBIDDEN')
    expect((await getOrganizationActivity()).error?.code).toBe('FORBIDDEN')
  })

  it('pages the activity feed newest first with resolved names', async () => {
    access.role = 'admin'
    const { listOrganizationActivity } = await import('@/actions/organizations/activity-core')
    const first = await listOrganizationActivity(access.organizationId, { limit: 1 })
    expect(first.items[0]).toMatchObject({ action: 'certificate.approved', actor: 'tutor', target: 'holder' })
    expect(first.nextCursor).not.toBeNull()
    const second = await listOrganizationActivity(access.organizationId, {
      cursor: first.nextCursor ?? undefined,
      limit: 1,
    })
    expect(second.items[0]).toMatchObject({ action: 'member.joined', role: 'volunteer', target: 'holder' })
    expect(second.nextCursor).toBeNull()
  })

  it('names invitees from the invitation row and stays neutral once it is gone', async () => {
    access.role = 'admin'
    const { client, schema } = context
    const { listOrganizationActivity } = await import('@/actions/organizations/activity-core')
    const [invitation] = await client.db
      .insert(schema.organizationInvitations)
      .values({
        email: `guest-${suffix}@invite.test`,
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        organizationId: access.organizationId,
        role: 'volunteer',
        tokenHash: hashToken(`activity-${suffix}`),
      })
      .returning({ id: schema.organizationInvitations.id })
    if (!invitation) throw new Error('Failed to create the invitation')
    const event = (action: string, invitationId: number) => ({
      action,
      actorId: ids.owner,
      metadata: { invitationId, role: 'volunteer', userId: null },
      organizationId: access.organizationId,
      subjectId: String(invitationId),
      subjectType: 'invitation' as const,
    })
    await client.db
      .insert(schema.activityEvents)
      .values([event('invitation.sent', invitation.id), event('invitation.declined', -invitation.id)])

    const { items } = await listOrganizationActivity(access.organizationId, { limit: 2 })
    await client.db.delete(schema.organizationInvitations).where(eq(schema.organizationInvitations.id, invitation.id))
    const { items: afterwards } = await listOrganizationActivity(access.organizationId, { limit: 2 })
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, access.organizationId))

    expect(items.find(({ action }) => action === 'invitation.sent')).toMatchObject({
      actor: 'owner',
      target: `guest-${suffix}@invite.test`,
    })
    expect(items.find(({ action }) => action === 'invitation.declined')?.target).toBeNull()
    expect(afterwards.find(({ action }) => action === 'invitation.sent')?.target).toBeNull()
  })
})
