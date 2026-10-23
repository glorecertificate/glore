import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Jar } from '@/lib/test-jar'

import { createAdminFixture, isLocalDatabase } from './test-harness'

const current = vi.hoisted(() => ({ jar: null as null | { headers: () => Headers } }))
const mail = vi.hoisted(() => ({ sent: [] as { template: { name: string } }[] }))

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
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => Promise.resolve({ limited: false, remaining: 1 }),
  clientAddress: () => Promise.resolve('127.0.0.1'),
  isRateLimited: () => Promise.resolve(false),
}))
vi.mock('@/lib/email', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/email')>()),
  sendMail: (options: (typeof mail.sent)[number]) => {
    mail.sent.push(options)
    return Promise.resolve()
  },
}))

const PASSWORD = 'Password1!'
const KEYS = ['admin', 'user'] as const
const LOCKED = { code: 'NOT_ALLOWED_WHILE_IMPERSONATING' }

describe.skipIf(!isLocalDatabase)('actions locked while impersonating', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let impersonation: typeof import('@/actions/admin/impersonation')
  let authActions: typeof import('@/actions/auth')
  let userActions: typeof import('@/actions/user')
  let members: typeof import('@/actions/organizations/members')
  let requests: typeof import('@/actions/certificates/requests')
  let review: typeof import('@/actions/certificates/review')
  let settings: typeof import('@/actions/organizations/settings')
  let preferences: typeof import('@/actions/account/preferences')

  const as = (jar: Jar | null) => {
    current.jar = jar
  }

  const impersonate = async () => {
    const jar = await fixture.signIn('admin')
    as(jar)
    const result = await impersonation.startImpersonation({
      reason: 'Helping with a support ticket',
      userId: fixture.ids.user,
    })
    if (!result.data) throw new Error(`Start failed: ${result.error?.code}`)
    return jar
  }

  const stop = async (jar: Jar) => {
    as(jar)
    await impersonation.stopImpersonation()
  }

  const findUser = async () =>
    await fixture.client.db.query.users.findFirst({ where: eq(fixture.schema.users.id, fixture.ids.user) })

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS, { admins: ['admin'] })
    ;[impersonation, authActions, userActions, members, requests, review, settings, preferences] = await Promise.all([
      import('@/actions/admin/impersonation'),
      import('@/actions/auth'),
      import('@/actions/user'),
      import('@/actions/organizations/members'),
      import('@/actions/certificates/requests'),
      import('@/actions/certificates/review'),
      import('@/actions/organizations/settings'),
      import('@/actions/account/preferences'),
    ])
  }, 60_000)

  beforeEach(() => {
    mail.sent.length = 0
    const api = fixture.auth.api as unknown as Record<string, (context: Record<string, unknown>) => Promise<unknown>>
    for (const name of ['impersonateUser', 'stopImpersonating']) {
      const original = api[name]
      if (!original) throw new Error(`Missing endpoint ${name}`)
      vi.spyOn(api, name).mockImplementation(async context => {
        const result = (await original({ ...context, returnHeaders: true })) as { headers: Headers; response: unknown }
        ;(current.jar as null | Jar)?.apply(result.headers)
        return context.returnHeaders ? result : result.response
      })
    }
  })

  afterAll(async () => {
    as(null)
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  it('refuses a password change and keeps the password', async () => {
    const jar = await impersonate()

    expect(await authActions.changePassword(PASSWORD, 'Another-Pass-2!')).toMatchObject({ error: LOCKED })
    expect(mail.sent).toHaveLength(0)

    await stop(jar)
    await expect(
      fixture.auth.api.signInEmail({ body: { email: fixture.emails.user, password: PASSWORD } })
    ).resolves.toBeDefined()
  })

  it('refuses a username change and an email change', async () => {
    const jar = await impersonate()
    const before = await findUser()

    const renamed = await userActions.updateAccount({ username: `renamed${fixture.suffix}` })
    expect(renamed).toMatchObject({ error: LOCKED })
    const moved = await userActions.updateAccount({ email: `moved-${fixture.suffix}@admin-lane.test` })
    expect(moved).toMatchObject({ error: LOCKED })

    expect(mail.sent).toHaveLength(0)
    expect(await findUser()).toMatchObject({ email: before?.email, username: before?.username })
    await stop(jar)
  })

  it('still lets the impersonating admin change the locale', async () => {
    const jar = await impersonate()

    const result = await userActions.updateAccount({ locale: 'it' })
    expect(result.error).toBeUndefined()
    expect(await findUser()).toMatchObject({ locale: 'it' })

    await stop(jar)
  })

  it('refuses an ownership transfer', async () => {
    const jar = await impersonate()

    const result = await members.transferOrganizationOwnership({ confirmation: 'Anything', newOwnerMembershipId: 1 })
    expect(result).toMatchObject({ error: LOCKED })

    await stop(jar)
    as(await fixture.signIn('user'))
    const control = await members.transferOrganizationOwnership({ confirmation: 'Anything', newOwnerMembershipId: 1 })
    expect(control.error?.code).not.toBe(LOCKED.code)
  })

  it('refuses to change the featured certificate', async () => {
    const jar = await impersonate()

    expect(await requests.featureCertificate(1)).toMatchObject({ error: LOCKED })

    await stop(jar)
    as(await fixture.signIn('user'))
    const control = await requests.featureCertificate(-1)
    expect(control.error?.code).not.toBe(LOCKED.code)
  })

  it('refuses to delete an organization', async () => {
    const jar = await impersonate()

    expect(await settings.deleteOrganization()).toMatchObject({ error: LOCKED })

    await stop(jar)
    as(await fixture.signIn('user'))
    const control = await settings.deleteOrganization()
    expect(control.error?.code).not.toBe(LOCKED.code)
  })

  it('refuses to revoke a certificate', async () => {
    const jar = await impersonate()

    expect(await review.revokeCertificate(1, { reason: 'Revoked during a support session' })).toMatchObject({
      error: LOCKED,
    })

    await stop(jar)
    as(await fixture.signIn('user'))
    const control = await review.revokeCertificate(-1, { reason: 'Revoked during a support session' })
    expect(control.error?.code).not.toBe(LOCKED.code)
  })

  it('refuses a privacy change and keeps the profile setting', async () => {
    const jar = await impersonate()
    const before = await findUser()

    expect(await preferences.updatePrivacy({ publicProfile: !before?.publicProfile })).toMatchObject({ error: LOCKED })
    expect(await findUser()).toMatchObject({ publicProfile: before?.publicProfile })

    await stop(jar)
  })
})
