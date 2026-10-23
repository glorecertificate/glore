import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminFixture, isLocalDatabase } from '@/actions/admin/test-harness'
import { userTag } from '@/lib/cache'

const current = vi.hoisted(() => ({ jar: null as null | { headers: () => Headers } }))
const mail = vi.hoisted(() => ({ sent: [] as { template: { name: string; props: { url?: string } }; to: string }[] }))
const revalidateTag = vi.hoisted(() => vi.fn())

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
  revalidateTag,
  updateTag: vi.fn(),
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

const KEYS = ['mover'] as const

describe.skipIf(!isLocalDatabase)('email change confirmation', () => {
  let fixture: Awaited<ReturnType<typeof createAdminFixture<(typeof KEYS)[number]>>>
  let userActions: typeof import('@/actions/user')

  beforeAll(async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000')
    fixture = await createAdminFixture(KEYS)
    userActions = await import('@/actions/user')
  }, 60_000)

  beforeEach(() => {
    mail.sent.length = 0
    revalidateTag.mockClear()
  })

  afterAll(async () => {
    current.jar = null
    await fixture.cleanup()
    vi.unstubAllEnvs()
  })

  it('moves the address when the link is opened and expires the cached user', async () => {
    const jar = await fixture.signIn('mover')
    current.jar = jar
    const newEmail = `moved-${fixture.suffix}@admin-lane.test`

    const requested = await userActions.updateAccount({ email: newEmail })
    expect(requested).toMatchObject({ pendingEmail: newEmail })
    expect((await fixture.findUser('mover')).email).toBe(fixture.emails.mover)

    const url = mail.sent.find(item => item.template.name === 'auth/verify-email' && item.to === newEmail)?.template
      .props.url
    const token = url ? new URL(url).searchParams.get('token') : null
    expect(token).toBeTruthy()

    revalidateTag.mockClear()
    await fixture.auth.api.verifyEmail({ headers: jar.headers(), query: { token: token ?? '' } })

    expect((await fixture.findUser('mover')).email).toBe(newEmail)
    expect(revalidateTag).toHaveBeenCalledWith(userTag(fixture.ids.mover), { expire: 0 })
  })
})
