import { inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { generateCertificateCode } from '@/components/features/certificates/rules'
import { ADMIN_AUDIT_PAGE_SIZE } from '@/db/queries/admin-audit'

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

const KEYS = ['admin', 'member', 'holder', 'other'] as const

type Key = (typeof KEYS)[number]

describe.skipIf(!isLocalDatabase)('admin audit log', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<Key>>>
  let actions: typeof import('@/actions/admin/audit')
  let tag = ''
  const eventIds: number[] = []
  const organizationIds: number[] = []
  const ids = {
    approved: 0,
    deletedActor: 0,
    old: 0,
    reinstated: 0,
    revoked: 0,
    roleChanged: 0,
    started: 0,
    suspended: 0,
    unaudited: 0,
  }
  let organizationId = 0
  let certificateId = 0
  const CODE = generateCertificateCode()

  const as = (key: Key | null) => {
    current.cookie = key ? (fixture.jars[key]?.header() ?? '') : ''
  }

  const insertEvent = async (values: {
    action: string
    actor: Key | null
    createdAt?: string
    metadata?: Record<string, unknown>
    organizationId?: number | null
    subjectId: string
    subjectType: string
  }) => {
    const { actor, ...rest } = values
    const [row] = await fixture.client.db
      .insert(fixture.schema.activityEvents)
      .values({ ...rest, actorId: actor ? fixture.ids[actor] : null, metadata: rest.metadata ?? {} })
      .returning({ id: fixture.schema.activityEvents.id })
    if (!row) throw new Error('Failed to insert event')
    eventIds.push(row.id)
    return row.id
  }

  const list = async (input: Parameters<typeof actions.listAdminAudit>[0]) => {
    as('admin')
    const result = await actions.listAdminAudit({ q: tag, ...input })
    if (result.error) throw new Error(result.error.code)
    return result.data
  }

  beforeAll(async () => {
    fixture = await createAdminFixture(KEYS, { admins: ['admin'] })
    tag = fixture.suffix
    actions = await import('@/actions/admin/audit')
    for (const key of KEYS) await fixture.signIn(key)
    const { db } = fixture.client

    const [organization] = await db
      .insert(fixture.schema.organizations)
      .values({
        city: 'Milan',
        email: `org-${tag}@audit-lane.test`,
        handle: `audit-lane-${tag}`,
        name: `Audit Org ${tag}`,
      })
      .returning({ id: fixture.schema.organizations.id })
    if (!organization) throw new Error('Failed to insert organization')
    organizationId = organization.id
    organizationIds.push(organization.id)

    const [certificate] = await db
      .insert(fixture.schema.certificates)
      .values({
        activityDescription: 'Helped at the community centre every week',
        activityDuration: 120,
        activityEndDate: '2026-06-30',
        activityLocation: 'Milan',
        activityStartDate: '2026-01-10',
        code: CODE,
        handle: `audit-lane-${tag}-cert`,
        language: 'en',
        organizationId,
        status: 'revoked',
        submittedAt: new Date().toISOString(),
        tasks: ['Welcomed new volunteers'],
        userId: fixture.ids.holder,
      })
      .returning({ id: fixture.schema.certificates.id })
    if (!certificate) throw new Error('Failed to insert certificate')
    certificateId = certificate.id

    const { holder, other } = fixture.ids
    ids.suspended = await insertEvent({
      action: 'account.suspended',
      actor: 'admin',
      metadata: { expiresAt: '2030-01-01T00:00:00.000Z', reason: 'Repeated spam reports', userId: holder },
      subjectId: holder,
      subjectType: 'account',
    })
    ids.reinstated = await insertEvent({
      action: 'account.reinstated',
      actor: 'admin',
      metadata: { userId: holder },
      subjectId: holder,
      subjectType: 'account',
    })
    ids.roleChanged = await insertEvent({
      action: 'team.role_changed',
      actor: 'admin',
      metadata: { role: 'editor', userId: other },
      subjectId: other,
      subjectType: 'user',
    })
    ids.started = await insertEvent({
      action: 'impersonation.started',
      actor: 'admin',
      metadata: {
        expiresAt: '2030-01-01T00:00:00.000Z',
        reason: 'Support request 4411',
        sessionId: 's1',
        userId: holder,
      },
      subjectId: holder,
      subjectType: 'user',
    })
    ids.revoked = await insertEvent({
      action: 'certificate.revoked',
      actor: 'admin',
      metadata: { certificateId, holderId: holder, reason: 'Issued by mistake' },
      organizationId,
      subjectId: String(certificateId),
      subjectType: 'certificate',
    })
    ids.approved = await insertEvent({
      action: 'organization.application_decided',
      actor: 'admin',
      metadata: {
        applicantName: `Applicant ${tag}`,
        approved: true,
        comment: 'Welcome aboard',
        organizationName: `Audit Org ${tag}`,
      },
      organizationId,
      subjectId: `audit-lane-${tag}`,
      subjectType: 'organization',
    })
    ids.deletedActor = await insertEvent({
      action: 'team.invited',
      actor: null,
      metadata: { name: 'Other', role: 'admin', userId: other },
      subjectId: other,
      subjectType: 'user',
    })
    ids.unaudited = await insertEvent({
      action: 'certificate.approved',
      actor: 'admin',
      metadata: { certificateId, holderId: holder },
      organizationId,
      subjectId: String(certificateId),
      subjectType: 'certificate',
    })
    ids.old = await insertEvent({
      action: 'account.suspended',
      actor: 'admin',
      createdAt: '2020-03-04T10:00:00.000Z',
      metadata: { expiresAt: null, reason: 'Old spam reports', userId: other },
      subjectId: other,
      subjectType: 'account',
    })
  }, 60_000)

  afterAll(async () => {
    const { db } = fixture.client
    const { activityEvents, certificates, organizations } = fixture.schema
    await db.delete(activityEvents).where(inArray(activityEvents.id, eventIds))
    if (organizationIds.length > 0) {
      await db.delete(certificates).where(inArray(certificates.organizationId, organizationIds))
      await db.delete(organizations).where(inArray(organizations.id, organizationIds))
    }
    await fixture.cleanup()
  })

  it('refuses unauthenticated callers', async () => {
    as(null)
    const { data, error } = await actions.listAdminAudit({ page: 1 })
    expect(data).toBeNull()
    expect(error?.code).toBe('UNAUTHORIZED')
  })

  it('refuses callers who are not platform admins', async () => {
    as('member')
    const { data, error } = await actions.listAdminAudit({ page: 1 })
    expect(data).toBeNull()
    expect(error?.code).toBe('FORBIDDEN')
  })

  it.each([{ category: 'unknown' }, { from: '2026-13-40' }, { to: 'tomorrow' }])('rejects %o', async input => {
    as('admin')
    const { data, error } = await actions.listAdminAudit(input as never)
    expect(data).toBeNull()
    expect(error?.code).toBe('INVALID_INPUT')
  })

  it('lists audited events newest first and leaves out other actions', async () => {
    const page = await list({})
    const listed = page.rows.map(({ id }) => id)
    expect(listed).toEqual([
      ids.deletedActor,
      ids.approved,
      ids.revoked,
      ids.started,
      ids.roleChanged,
      ids.reinstated,
      ids.suspended,
      ids.old,
    ])
    expect(listed).not.toContain(ids.unaudited)
    expect(page.total).toBe(8)
    expect(page.pageSize).toBe(ADMIN_AUDIT_PAGE_SIZE)
  })

  it('resolves actors, targets, details, and organizations', async () => {
    const page = await list({})
    const byId = new Map(page.rows.map(row => [row.id, row]))

    expect(byId.get(ids.suspended)).toMatchObject({
      actor: { email: fixture.emails.admin, id: fixture.ids.admin, name: 'admin' },
      category: 'moderation',
      detail: { expiresAt: '2030-01-01T00:00:00.000Z', reason: 'Repeated spam reports' },
      target: {
        href: `/admin/users?q=${encodeURIComponent(fixture.emails.holder)}`,
        kind: 'user',
        label: 'holder',
      },
    })
    expect(byId.get(ids.roleChanged)).toMatchObject({ category: 'access', detail: { role: 'editor' } })
    expect(byId.get(ids.started)).toMatchObject({
      category: 'impersonation',
      detail: { reason: 'Support request 4411' },
    })
    expect(byId.get(ids.revoked)).toMatchObject({
      category: 'certificates',
      detail: { reason: 'Issued by mistake' },
      organization: { id: organizationId, name: `Audit Org ${tag}` },
      target: { href: `/certificates/${certificateId}`, kind: 'certificate', label: CODE },
    })
    expect(byId.get(ids.approved)).toMatchObject({
      category: 'organizations',
      detail: { approved: true, comment: 'Welcome aboard' },
      target: { href: `/admin/organizations/${organizationId}`, kind: 'organization', label: `Audit Org ${tag}` },
    })
  })

  it('keeps events whose actor account is gone', async () => {
    const page = await list({})
    const row = page.rows.find(({ id }) => id === ids.deletedActor)
    expect(row?.actor).toBeNull()
    expect(row?.target?.label).toBe('other')
  })

  it('filters by category', async () => {
    const page = await list({ category: 'moderation' })
    expect(page.rows.map(({ id }) => id)).toEqual([ids.reinstated, ids.suspended, ids.old])
  })

  it('searches by the email of the person an event is about', async () => {
    const page = await list({ q: fixture.emails.other })
    expect(page.rows.map(({ id }) => id)).toEqual([ids.deletedActor, ids.roleChanged, ids.old])
  })

  it('matches every search token against the actor, the person, or the organization name', async () => {
    const page = await list({ q: `admin audit org ${tag}` })
    expect(page.rows.map(({ id }) => id)).toEqual([ids.approved])
  })

  it('searches by applicant name', async () => {
    const page = await list({ q: `Applicant ${tag}` })
    expect(page.rows.map(({ id }) => id)).toEqual([ids.approved])
  })

  it('filters by date range in UTC', async () => {
    const only = await list({ from: '2020-03-04', to: '2020-03-04' })
    expect(only.rows.map(({ id }) => id)).toEqual([ids.old])

    const recent = await list({ from: '2020-03-05' })
    expect(recent.rows.map(({ id }) => id)).not.toContain(ids.old)
    expect(recent.total).toBe(7)

    const before = await list({ to: '2020-03-03' })
    expect(before.rows).toEqual([])
  })

  it('returns an empty page when nothing matches', async () => {
    const page = await list({ q: `nothing-${tag}-matches` })
    expect(page.rows).toEqual([])
    expect(page.total).toBe(0)
    expect(page.pageCount).toBe(1)
  })

  it('pages through more events than one page holds and clamps a page past the end', async () => {
    for (let index = 0; index < ADMIN_AUDIT_PAGE_SIZE + 1; index += 1) {
      await insertEvent({
        action: 'account.reinstated',
        actor: 'admin',
        metadata: { userId: fixture.ids.holder },
        subjectId: fixture.ids.holder,
        subjectType: 'account',
      })
    }
    const first = await list({ page: 1 })
    const second = await list({ page: 2 })
    const clamped = await list({ page: 99 })
    expect(first.total).toBe(8 + ADMIN_AUDIT_PAGE_SIZE + 1)
    expect(first.pageCount).toBe(2)
    expect(first.rows).toHaveLength(ADMIN_AUDIT_PAGE_SIZE)
    expect(second.rows).toHaveLength(first.total - ADMIN_AUDIT_PAGE_SIZE)
    expect(clamped.page).toBe(2)
    const listed = [...first.rows, ...second.rows].map(({ id }) => id)
    expect(new Set(listed).size).toBe(listed.length)
  })
})
