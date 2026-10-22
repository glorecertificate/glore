import { randomUUID } from 'node:crypto'

import { inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { generateCertificateCode } from '@/components/features/certificates/rules'
import { ADMIN_CERTIFICATES_PAGE_SIZE } from '@/db/queries/admin-certificate'

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

describe.skipIf(!isLocalDatabase)('admin certificate lookup', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let actions: typeof import('@/actions/admin/certificates')
  const tag = randomUUID().slice(0, 8)
  const organizationIds: number[] = []
  const codes = { approved: generateCertificateCode(), revoked: generateCertificateCode() }
  let orgA = 0
  let orgB = 0

  const as = (key: (typeof KEYS)[number] | null) => {
    current.cookie = key ? (fixture.jars[key]?.header() ?? '') : ''
  }

  const insertOrganization = async (suffix: string, name: string) => {
    const [row] = await fixture.client.db
      .insert(fixture.schema.organizations)
      .values({
        city: 'Milan',
        email: `org-${suffix}-${tag}@certs-lane.test`,
        handle: `certs-lane-${tag}-${suffix}`,
        name,
      })
      .returning({ id: fixture.schema.organizations.id })
    if (!row) throw new Error('Failed to insert organization')
    organizationIds.push(row.id)
    return row.id
  }

  const insertCertificate = async (values: {
    code?: string | null
    key: (typeof KEYS)[number]
    organizationId: number
    status: (typeof fixture.schema.certificates.$inferInsert)['status']
    submittedAt?: string | null
  }) => {
    const { key, submittedAt, ...rest } = values
    const [row] = await fixture.client.db
      .insert(fixture.schema.certificates)
      .values({
        activityDescription: 'Helped at the community centre every week',
        activityDuration: 120,
        activityEndDate: '2026-06-30',
        activityLocation: 'Milan',
        activityStartDate: '2026-01-10',
        handle: `certs-lane-${tag}-${randomUUID().slice(0, 8)}`,
        language: 'en',
        submittedAt: submittedAt === undefined ? new Date().toISOString() : submittedAt,
        tasks: ['Welcomed new volunteers'],
        userId: fixture.ids[key],
        ...rest,
      })
      .returning({ id: fixture.schema.certificates.id })
    if (!row) throw new Error('Failed to insert certificate')
    return row.id
  }

  const search = async (input: Parameters<typeof actions.searchAdminCertificates>[0]) => {
    as('admin')
    const result = await actions.searchAdminCertificates(input)
    if (result.error) throw new Error(result.error.code)
    return result.data
  }

  const scoped = (rows: { organization: { id: number } }[]) =>
    rows.filter(({ organization }) => organizationIds.includes(organization.id))

  let approvedId = 0
  let revokedId = 0
  let submittedId = 0
  let draftId = 0
  let otherOrgId = 0

  beforeAll(async () => {
    fixture = await createAdminFixture(KEYS, { admins: ['admin'] })
    actions = await import('@/actions/admin/certificates')
    for (const key of KEYS) await fixture.signIn(key)

    orgA = await insertOrganization('a', `Zebra Collective ${tag}`)
    orgB = await insertOrganization('b', `Yak Network ${tag}`)
    const day = (offset: number) => new Date(Date.now() - offset * 24 * 60 * 60 * 1000).toISOString()

    approvedId = await insertCertificate({
      code: `${codes.approved}`,
      key: 'holder',
      organizationId: orgA,
      status: 'approved',
      submittedAt: day(3),
    })
    revokedId = await insertCertificate({
      code: `${codes.revoked}`,
      key: 'other',
      organizationId: orgB,
      status: 'revoked',
      submittedAt: day(2),
    })
    submittedId = await insertCertificate({
      key: 'holder',
      organizationId: orgB,
      status: 'submitted',
      submittedAt: day(1),
    })
    draftId = await insertCertificate({ key: 'holder', organizationId: orgA, status: 'draft', submittedAt: null })
    otherOrgId = orgB
  }, 60_000)

  afterAll(async () => {
    const { db } = fixture.client
    if (organizationIds.length > 0) {
      await db
        .delete(fixture.schema.certificates)
        .where(inArray(fixture.schema.certificates.organizationId, organizationIds))
      await db.delete(fixture.schema.organizations).where(inArray(fixture.schema.organizations.id, organizationIds))
    }
    await fixture.cleanup()
  })

  it('refuses unauthenticated callers', async () => {
    as(null)
    const { data, error } = await actions.searchAdminCertificates({ page: 1, q: '' })
    expect(data).toBeNull()
    expect(error?.code).toBe('UNAUTHORIZED')
  })

  it('refuses callers who are not platform admins', async () => {
    as('member')
    const { data, error } = await actions.searchAdminCertificates({ page: 1, q: '' })
    expect(data).toBeNull()
    expect(error?.code).toBe('FORBIDDEN')
  })

  it('rejects an unknown status filter', async () => {
    as('admin')
    const { data, error } = await actions.searchAdminCertificates({
      page: 1,
      q: '',
      status: 'draft' as never,
    })
    expect(data).toBeNull()
    expect(error?.code).toBe('INVALID_INPUT')
  })

  it('lists submitted certificates newest first and leaves out drafts', async () => {
    const page = await search({ page: 1, q: tag })
    const ids = page.rows.map(({ id }) => id)
    expect(ids).toEqual([submittedId, revokedId, approvedId])
    expect(ids).not.toContain(draftId)
    expect(page.rows[0]).toMatchObject({
      holder: { email: fixture.emails.holder, id: fixture.ids.holder },
      organization: { id: otherOrgId },
      status: 'submitted',
    })
  })

  it('finds a certificate by its exact code', async () => {
    const page = await search({ page: 1, q: codes.approved })
    expect(page.rows.map(({ id }) => id)).toEqual([approvedId])
  })

  it('finds a certificate by a lower-case code without dashes', async () => {
    const page = await search({ page: 1, q: codes.revoked.replaceAll('-', '').toLowerCase() })
    expect(page.rows.map(({ id }) => id)).toEqual([revokedId])
  })

  it('finds certificates by holder email', async () => {
    const page = await search({ page: 1, q: fixture.emails.other })
    expect(page.rows.map(({ id }) => id)).toEqual([revokedId])
  })

  it('finds certificates by holder name and organization name together', async () => {
    const page = await search({ page: 1, q: `holder zebra ${tag}` })
    expect(page.rows.map(({ id }) => id)).toEqual([approvedId])
  })

  it('finds certificates by organization name', async () => {
    const page = await search({ page: 1, q: `yak network ${tag}` })
    expect(page.rows.map(({ id }) => id)).toEqual([submittedId, revokedId])
  })

  it('filters by status', async () => {
    const page = await search({ page: 1, q: tag, status: 'revoked' })
    expect(page.rows.map(({ id }) => id)).toEqual([revokedId])
  })

  it('returns an empty page when nothing matches', async () => {
    const page = await search({ page: 1, q: `nothing-${tag}-matches` })
    expect(page.rows).toEqual([])
    expect(page.total).toBe(0)
    expect(page.pageCount).toBe(1)
  })

  it('clamps a page past the end to the last page', async () => {
    const page = await search({ page: 99, q: tag })
    expect(page.page).toBe(1)
    expect(scoped(page.rows)).toHaveLength(3)
    expect(page.pageSize).toBe(ADMIN_CERTIFICATES_PAGE_SIZE)
  })

  it('pages through more certificates than one page holds', async () => {
    const extra = ADMIN_CERTIFICATES_PAGE_SIZE
    for (let index = 0; index < extra; index += 1) {
      await insertCertificate({
        key: 'other',
        organizationId: orgA,
        status: 'in_review',
        submittedAt: new Date(Date.now() - (10 + index) * 60 * 1000).toISOString(),
      })
    }
    const first = await search({ page: 1, q: tag })
    const second = await search({ page: 2, q: tag })
    expect(first.total).toBe(3 + extra)
    expect(first.pageCount).toBe(2)
    expect(first.rows).toHaveLength(ADMIN_CERTIFICATES_PAGE_SIZE)
    expect(second.rows).toHaveLength(3)
    const ids = [...first.rows, ...second.rows].map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
