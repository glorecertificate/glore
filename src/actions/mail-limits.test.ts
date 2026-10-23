import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminFixture, isLocalDatabase } from '@/actions/admin/test-harness'
import { type Jar } from '@/lib/test-jar'

const current = vi.hoisted(() => ({ jar: null as null | { headers: () => Headers } }))
const limiter = vi.hoisted(() => ({ keys: [] as string[], limited: new Set<string>() }))
const mail = vi.hoisted(() => ({ sent: [] as { to: string }[] }))

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
vi.mock('@/actions/cookies', () => ({
  deleteCookie: vi.fn(),
  getCookie: () => Promise.resolve(undefined),
  setCookie: vi.fn(),
}))
vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: (key: string) => {
    limiter.keys.push(key)
    return Promise.resolve(limiter.limited.has(key))
  },
}))
vi.mock('@/lib/email', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/email')>()),
  sendMail: (options: (typeof mail.sent)[number]) => {
    mail.sent.push(options)
    return Promise.resolve()
  },
}))

const KEYS = ['owner'] as const

describe.skipIf(!isLocalDatabase)('per-user limits on actions that send mail', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let invitations: typeof import('@/actions/organizations/invitations')
  let userActions: typeof import('@/actions/user')
  let organizationId: number
  let jar: Jar

  const invitationCount = async () =>
    (
      await fixture.client.db.query.organizationInvitations.findMany({
        columns: { id: true },
        where: eq(fixture.schema.organizationInvitations.organizationId, organizationId),
      })
    ).length

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS)
    const [organization] = await fixture.client.db
      .insert(fixture.schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: `org-${fixture.suffix}@admin-lane.test`,
        handle: `mail-limits-${fixture.suffix}`,
        name: `Mail limits ${fixture.suffix}`,
      })
      .returning({ id: fixture.schema.organizations.id })
    if (!organization) throw new Error('Failed to insert organization')
    organizationId = organization.id
    await fixture.client.db
      .insert(fixture.schema.memberships)
      .values({ organizationId, role: 'admin', userId: fixture.ids.owner })
    ;[invitations, userActions] = await Promise.all([
      import('@/actions/organizations/invitations'),
      import('@/actions/user'),
    ])
    jar = await fixture.signIn('owner')
  }, 60_000)

  beforeEach(() => {
    current.jar = jar
    mail.sent.length = 0
    limiter.keys.length = 0
    limiter.limited.clear()
  })

  afterAll(async () => {
    current.jar = null
    await fixture.client.db
      .delete(fixture.schema.organizations)
      .where(eq(fixture.schema.organizations.id, organizationId))
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  it('limits bulk invitations per manager before creating any invitation', async () => {
    limiter.limited.add(`org-invite:${fixture.ids.owner}`)

    const result = await invitations.inviteOrganizationMembers({
      emails: [`invitee-${fixture.suffix}@admin-lane.test`],
      locale: 'en',
      role: 'volunteer',
    })

    expect(result).toMatchObject({ data: null, error: { code: 'RATE_LIMITED' } })
    expect(await invitationCount()).toBe(0)
  })

  it('still sends invitations under the limit', async () => {
    const result = await invitations.inviteOrganizationMembers({
      emails: [`invitee-${fixture.suffix}@admin-lane.test`],
      locale: 'en',
      role: 'volunteer',
    })

    expect(result.error).toBeNull()
    expect(result.data).toEqual([{ email: `invitee-${fixture.suffix}@admin-lane.test`, status: 'sent' }])
    expect(limiter.keys).toContain(`org-invite:${fixture.ids.owner}`)
  })

  it('limits email changes per user before any mail is sent', async () => {
    limiter.limited.add(`email-change:${fixture.ids.owner}`)
    const before = await fixture.findUser('owner')

    const result = await userActions.updateAccount({ email: `moved-${fixture.suffix}@admin-lane.test` })

    expect(result).toMatchObject({ error: { code: 'RATE_LIMITED' } })
    expect(mail.sent).toHaveLength(0)
    expect((await fixture.findUser('owner')).email).toBe(before.email)
  })

  it('does not spend the email change budget on other account edits', async () => {
    const result = await userActions.updateAccount({ locale: 'es' })

    expect(result.error).toBeUndefined()
    expect(limiter.keys.some(key => key.startsWith('email-change:'))).toBe(false)
  })
})
