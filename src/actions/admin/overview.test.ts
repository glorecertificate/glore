import { randomUUID } from 'node:crypto'

import { inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { ADMIN_OVERVIEW_MONTHS } from '@/db/queries/admin-overview'

import { createAdminFixture, isLocalDatabase } from './test-harness'

const current = vi.hoisted(() => ({ cookie: '' }))

vi.mock('next/headers', async importOriginal => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  headers: () => Promise.resolve(new Headers({ cookie: current.cookie })),
}))
vi.mock('next/cache', async importOriginal => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
}))

const KEYS = ['admin', 'member', 'joinerA', 'joinerB', 'banned'] as const

type Key = (typeof KEYS)[number]

const HOUR = 60 * 60 * 1000

describe.skipIf(!isLocalDatabase)('admin overview', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<Key>>>
  let actions: typeof import('@/actions/admin/overview')
  const tag = randomUUID().slice(0, 8)
  const organizationIds: number[] = []

  const as = (key: Key | null) => {
    current.cookie = key ? (fixture.jars[key]?.header() ?? '') : ''
  }

  const overview = async () => {
    as('admin')
    const result = await actions.getAdminOverview()
    if (!result.data) throw new Error(result.error?.code)
    return result.data
  }

  const oldestMonth = (months: { month: string }[]) => {
    const month = months[0]
    if (!month) throw new Error('No months')
    return month.month
  }

  const at = (month: string, hours = 0) =>
    new Date(Date.parse(`${month}-15T08:00:00.000Z`) + hours * HOUR).toISOString()

  const insertOrganization = async (suffix: string, values: { approvedAt?: string; createdAt: string }) => {
    const [row] = await fixture.client.db
      .insert(fixture.schema.organizations)
      .values({
        ...values,
        city: 'Milan',
        email: `org-${suffix}-${tag}@overview-lane.test`,
        handle: `overview-lane-${tag}-${suffix}`,
        name: `Overview Org ${suffix} ${tag}`,
      })
      .returning({ id: fixture.schema.organizations.id })
    if (!row) throw new Error('Failed to insert organization')
    organizationIds.push(row.id)
    return row.id
  }

  const insertCertificate = async (values: {
    issuedAt?: string
    organizationId: number
    reviewedAt?: string
    status: (typeof fixture.schema.certificates.$inferInsert)['status']
    submittedAt?: string
    userKey: Key
  }) => {
    const { userKey, ...rest } = values
    await fixture.client.db.insert(fixture.schema.certificates).values({
      activityDescription: 'Helped at the community centre every week',
      activityDuration: 120,
      activityEndDate: '2026-06-30',
      activityLocation: 'Milan',
      activityStartDate: '2026-01-10',
      handle: `overview-lane-${tag}-${randomUUID().slice(0, 8)}`,
      language: 'en',
      tasks: ['Welcomed new volunteers'],
      userId: fixture.ids[userKey],
      ...rest,
    })
  }

  beforeAll(async () => {
    fixture = await createAdminFixture(KEYS, { admins: ['admin'] })
    actions = await import('@/actions/admin/overview')
    for (const key of KEYS) await fixture.signIn(key)
  }, 60_000)

  afterAll(async () => {
    const { db } = fixture.client
    const { certificates, organizations } = fixture.schema
    if (organizationIds.length > 0) {
      await db.delete(certificates).where(inArray(certificates.organizationId, organizationIds))
      await db.delete(organizations).where(inArray(organizations.id, organizationIds))
    }
    await fixture.cleanup()
  })

  it('refuses unauthenticated callers', async () => {
    as(null)
    const { data, error } = await actions.getAdminOverview()
    expect(data).toBeNull()
    expect(error?.code).toBe('UNAUTHORIZED')
  })

  it('refuses callers who are not platform admins', async () => {
    as('member')
    const { data, error } = await actions.getAdminOverview()
    expect(data).toBeNull()
    expect(error?.code).toBe('FORBIDDEN')
  })

  it('returns consistent totals and a twelve month window', async () => {
    const data = await overview()
    expect(data.monthly).toHaveLength(ADMIN_OVERVIEW_MONTHS)
    expect(data.review.monthly.map(({ month }) => month)).toEqual(data.monthly.map(({ month }) => month))
    expect(data.organizations.active + data.organizations.pending + data.organizations.rejected).toBe(
      data.organizations.total
    )
    expect(data.users.total).toBeGreaterThanOrEqual(KEYS.length)
    expect(data.users.admins).toBeGreaterThanOrEqual(1)
    expect(data.certificates.total).toBe(Object.values(data.certificates.pipeline).reduce((sum, n) => sum + n, 0))
    expect(Number.isNaN(Date.parse(data.generatedAt))).toBe(false)
  })

  it('counts users in the month they joined', async () => {
    const before = await overview()
    const month = oldestMonth(before.monthly)
    const { db } = fixture.client
    await db
      .update(fixture.schema.users)
      .set({ createdAt: at(month) })
      .where(inArray(fixture.schema.users.id, [fixture.ids.joinerA, fixture.ids.joinerB]))
    const after = await overview()
    const bucket = (data: typeof before) => data.monthly.find(row => row.month === month)?.usersJoined ?? 0
    expect(bucket(after)).toBe(bucket(before) + 2)
  })

  it('counts a permanent ban', async () => {
    const { db } = fixture.client
    await db
      .update(fixture.schema.users)
      .set({ banExpires: null, banned: true })
      .where(inArray(fixture.schema.users.id, [fixture.ids.banned]))
    const after = await overview()
    expect(after.users.banned).toBeGreaterThanOrEqual(1)
  })

  it('counts organizations by month and by application state', async () => {
    const before = await overview()
    const month = oldestMonth(before.monthly)
    const approved = await insertOrganization('approved', { approvedAt: at(month, 24), createdAt: at(month) })
    const pending = await insertOrganization('pending', { createdAt: at(month) })
    const rejected = await insertOrganization('rejected', { createdAt: at(month) })
    await fixture.client.db.insert(fixture.schema.organizationJoinRequests).values({
      email: `applicant-${tag}@overview-lane.test`,
      firstName: 'Applicant',
      organizationId: rejected,
      role: 'admin',
      status: 'rejected',
    })
    expect([approved, pending, rejected]).toHaveLength(3)

    const after = await overview()
    const bucket = (data: typeof before) => data.monthly.find(row => row.month === month)
    expect(bucket(after)?.organizationsRegistered).toBe((bucket(before)?.organizationsRegistered ?? 0) + 3)
    expect(bucket(after)?.organizationsApproved).toBe((bucket(before)?.organizationsApproved ?? 0) + 1)
    expect(after.organizations.active).toBeGreaterThanOrEqual(1)
    expect(after.organizations.pending).toBeGreaterThanOrEqual(1)
    expect(after.organizations.rejected).toBeGreaterThanOrEqual(1)
    expect(after.organizations.active + after.organizations.pending + after.organizations.rejected).toBe(
      after.organizations.total
    )
  })

  it('counts certificates by month and measures review times', async () => {
    const before = await overview()
    const month = oldestMonth(before.monthly)
    const organizationId = await insertOrganization('reviews', { createdAt: at(month) })
    const hours = [2, 4, 12]
    for (const duration of hours) {
      await insertCertificate({
        issuedAt: at(month, duration),
        organizationId,
        reviewedAt: at(month, duration),
        status: 'approved',
        submittedAt: at(month),
        userKey: 'member',
      })
    }
    await insertCertificate({ organizationId, status: 'draft', userKey: 'member' })

    const after = await overview()
    const bucket = (data: typeof before) => data.monthly.find(row => row.month === month)
    const reviewBucket = (data: typeof before) => data.review.monthly.find(row => row.month === month)

    expect(bucket(after)?.certificatesSubmitted).toBe((bucket(before)?.certificatesSubmitted ?? 0) + 3)
    expect(bucket(after)?.certificatesApproved).toBe((bucket(before)?.certificatesApproved ?? 0) + 3)

    const previous = reviewBucket(before)
    const previousSample = previous?.sample ?? 0
    const expectedAverage =
      ((previous?.averageHours ?? 0) * previousSample + hours.reduce((a, b) => a + b, 0)) / (previousSample + 3)
    expect(reviewBucket(after)?.sample).toBe(previousSample + 3)
    expect(reviewBucket(after)?.averageHours).toBeCloseTo(expectedAverage, 0)
    expect(reviewBucket(after)?.medianHours).toBeGreaterThanOrEqual(2)
    expect(reviewBucket(after)?.medianHours).toBeLessThanOrEqual(12)
    expect(after.review.sample).toBeGreaterThanOrEqual(3)
    expect(after.certificates.pipeline.approved).toBeGreaterThanOrEqual(3)
    expect(after.certificates.drafts).toBeGreaterThanOrEqual(1)
  })

  it('counts requests waiting for a reviewer and those past the escalation limit', async () => {
    const organizationId = await insertOrganization('backlog', { createdAt: new Date().toISOString() })
    const old = new Date(Date.now() - 30 * 24 * HOUR).toISOString()
    await insertCertificate({ organizationId, status: 'submitted', submittedAt: old, userKey: 'member' })
    await insertCertificate({
      organizationId,
      status: 'in_review',
      submittedAt: new Date().toISOString(),
      userKey: 'member',
    })
    await insertCertificate({ organizationId, status: 'changes_requested', submittedAt: old, userKey: 'member' })

    const after = await overview()
    expect(after.review.waiting).toBeGreaterThanOrEqual(2)
    expect(after.review.overdue).toBeGreaterThanOrEqual(1)
    expect(after.review.overdue).toBeLessThanOrEqual(after.review.waiting)
  })
})
