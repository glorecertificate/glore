import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminFixture, isLocalDatabase } from '@/actions/admin/test-harness'

const cookieJar = vi.hoisted(() => new Map<string, string>())

vi.mock('next/headers', async importOriginal => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  cookies: () =>
    Promise.resolve({
      delete: (name: string) => cookieJar.delete(name),
      get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
      set: (name: string, value: string) => cookieJar.set(name, value),
    }),
  headers: () => Promise.resolve(new Headers()),
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
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: () => Promise.resolve(false),
}))

const KEYS = ['invitee', 'owner'] as const

describe.skipIf(!isLocalDatabase)('signing in to accept an invitation', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let invitee: typeof import('@/actions/organizations/invitee')
  let organizationId: number
  let token: string

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS)
    const [{ createInvitation }, actions] = await Promise.all([
      import('@/db/mutations/invitation'),
      import('@/actions/organizations/invitee'),
    ])
    invitee = actions
    await fixture.client.db
      .update(fixture.schema.users)
      .set({ locale: 'es' })
      .where(eq(fixture.schema.users.id, fixture.ids.invitee))
    const [organization] = await fixture.client.db
      .insert(fixture.schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: `org-${fixture.suffix}@admin-lane.test`,
        handle: `invitee-locale-${fixture.suffix}`,
        name: `Invitee locale ${fixture.suffix}`,
      })
      .returning({ id: fixture.schema.organizations.id })
    if (!organization) throw new Error('Failed to insert organization')
    organizationId = organization.id
    await fixture.client.db
      .insert(fixture.schema.memberships)
      .values({ organizationId, role: 'admin', userId: fixture.ids.owner })
    const created = await fixture.client.transaction(tx =>
      createInvitation(tx, {
        email: fixture.emails.invitee,
        expiryDays: 7,
        invitedById: fixture.ids.owner,
        organizationId,
        role: 'volunteer',
      })
    )
    token = created.invitation.token
  }, 60_000)

  beforeEach(() => {
    cookieJar.clear()
  })

  afterAll(async () => {
    await fixture.client.db
      .delete(fixture.schema.organizationInvitations)
      .where(eq(fixture.schema.organizationInvitations.organizationId, organizationId))
    await fixture.client.db
      .delete(fixture.schema.organizations)
      .where(eq(fixture.schema.organizations.id, organizationId))
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  it('opens the interface in the language stored on the account', async () => {
    cookieJar.set('NEXT_LOCALE', 'en')

    const result = await invitee.signInToAcceptInvitation({ password: 'Password1!', token })

    expect(result.error).toBeNull()
    expect(cookieJar.get('NEXT_LOCALE')).toBe('es')
  })

  it('leaves the language alone when the password is wrong', async () => {
    cookieJar.set('NEXT_LOCALE', 'en')

    const result = await invitee.signInToAcceptInvitation({ password: 'Wrong-password1!', token })

    expect(result.error).not.toBeNull()
    expect(cookieJar.get('NEXT_LOCALE')).toBe('en')
  })
})
