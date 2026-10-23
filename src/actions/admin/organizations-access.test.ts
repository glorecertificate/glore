import { eq, like } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminFixture, isLocalDatabase } from '@/actions/admin/test-harness'
import { type Jar } from '@/lib/test-jar'

const current = vi.hoisted(() => ({ jar: null as null | { headers: () => Headers }, limited: false }))

vi.mock('next/headers', async importOriginal => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  headers: () => Promise.resolve(current.jar?.headers() ?? new Headers()),
}))
vi.mock('next/server', async importOriginal => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: () => Promise.resolve(),
}))
vi.mock('next/cache', async importOriginal => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}))
vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: current.limited, remaining: 1 }),
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: () => Promise.resolve(false),
}))

const KEYS = ['admin', 'banned', 'user'] as const
const MISSING_ORGANIZATION = 2_000_000_000

describe.skipIf(!isLocalDatabase)('admin organization actions authorize against the live session', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let actions: typeof import('@/actions/admin/organizations')
  const jars = {} as Record<(typeof KEYS)[number], Jar>
  const createdIds: number[] = []

  const as = (key: (typeof KEYS)[number] | null) => {
    current.jar = key ? (jars[key] ?? null) : null
  }

  const input = (label: string) => ({
    city: 'Milan',
    country: 'it',
    email: `${label}-${fixture.suffix}@org-access.test`,
    name: `Access ${label} ${fixture.suffix}`,
  })

  const organizationsOf = async () => {
    const rows = await fixture.client.db.query.organizations.findMany({
      columns: { id: true },
      where: like(fixture.schema.organizations.email, `%-${fixture.suffix}@org-access.test`),
    })
    createdIds.push(...rows.map(row => row.id))
    return rows
  }

  beforeAll(async () => {
    fixture = await createAdminFixture(KEYS, { admins: ['admin', 'banned'] })
    actions = await import('@/actions/admin/organizations')
    for (const key of KEYS) jars[key] = await fixture.signIn(key)
    await fixture.client.db
      .update(fixture.schema.users)
      .set({ banned: true })
      .where(eq(fixture.schema.users.id, fixture.ids.banned))
  }, 60_000)

  beforeEach(() => {
    current.limited = false
    as(null)
  })

  afterAll(async () => {
    as(null)
    for (const id of createdIds) {
      await fixture.client.db
        .delete(fixture.schema.activityEvents)
        .where(eq(fixture.schema.activityEvents.organizationId, id))
      await fixture.client.db
        .delete(fixture.schema.organizationInvitations)
        .where(eq(fixture.schema.organizationInvitations.organizationId, id))
      await fixture.client.db.delete(fixture.schema.organizations).where(eq(fixture.schema.organizations.id, id))
    }
    await fixture.cleanup()
  })

  const attempts = () => [
    () => actions.getOrganizations({ cache: false }),
    () => actions.getAdminOrganization(MISSING_ORGANIZATION),
    () => actions.approveOrganization(MISSING_ORGANIZATION),
    () => actions.rejectOrganization(MISSING_ORGANIZATION),
    () => actions.createOrganization(input('create')),
    () =>
      actions.inviteOrganization({
        ...input('invite'),
        country: 'it',
        registrantEmail: `registrant-${fixture.suffix}@org-access.test`,
      }),
  ]

  it('refuses a signed-in user who is not an admin', async () => {
    as('user')
    for (const attempt of attempts()) {
      expect(await attempt()).toMatchObject({ data: null, error: { code: 'FORBIDDEN' } })
    }
    expect(await actions.getAdminOrganizationName(MISSING_ORGANIZATION)).toBeNull()
    expect(await organizationsOf()).toHaveLength(0)
  })

  it('refuses a request without a session', async () => {
    for (const attempt of attempts()) {
      expect(await attempt()).toMatchObject({ data: null, error: { code: 'UNAUTHORIZED' } })
    }
    expect(await organizationsOf()).toHaveLength(0)
  })

  it('refuses an admin who was banned while the session was still live', async () => {
    as('banned')
    for (const attempt of attempts()) {
      expect(await attempt()).toMatchObject({ data: null, error: { code: 'FORBIDDEN' } })
    }
    expect(await organizationsOf()).toHaveLength(0)
  })

  it('creates organizations for an admin and validates the input first', async () => {
    as('admin')

    const created = await actions.createOrganization(input('valid'))
    expect(created.error).toBeNull()
    expect(await organizationsOf()).toHaveLength(1)

    const invalid = [
      { ...input('no-email'), email: 'not-an-email' },
      { ...input('no-name'), name: '   ' },
      { ...input('no-city'), city: '' },
      { ...input('long-name'), name: 'x'.repeat(151) },
      { ...input('symbols'), name: '!!!' },
    ]
    for (const values of invalid) {
      expect(await actions.createOrganization(values)).toMatchObject({
        data: null,
        error: { code: 'INVALID_INPUT' },
      })
    }
    expect(await actions.approveOrganization(Number.NaN)).toMatchObject({ error: { code: 'INVALID_INPUT' } })
    expect(await actions.rejectOrganization(1, 'x'.repeat(2001))).toMatchObject({ error: { code: 'INVALID_INPUT' } })
    expect(await organizationsOf()).toHaveLength(1)
  })

  it('caps the hourly number of changes per admin', async () => {
    as('admin')
    current.limited = true

    expect(await actions.createOrganization(input('limited'))).toMatchObject({
      data: null,
      error: { code: 'RATE_LIMITED' },
    })
    expect(await actions.approveOrganization(MISSING_ORGANIZATION)).toMatchObject({
      error: { code: 'RATE_LIMITED' },
    })
    expect(await organizationsOf()).toHaveLength(1)
  })
})
