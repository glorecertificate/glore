import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const state = vi.hoisted(() => ({ keys: [] as string[], limited: new Set<string>(), pdf: 0 }))

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Headers({ 'x-forwarded-for': '203.0.113.9' })),
}))
vi.mock('@/lib/rate-limit', () => ({
  clientAddress: () => Promise.resolve('203.0.113.9'),
  isRateLimited: (key: string) => {
    state.keys.push(key)
    return Promise.resolve([...state.limited].some(prefix => key.startsWith(prefix)))
  },
}))
vi.mock('@/actions/auth', () => ({ getAuthUser: () => Promise.resolve({ id: 'lane-x-user' }) }))
vi.mock('@/actions/certificates/pdf', () => ({
  certificatePdf: () => {
    state.pdf += 1
    return Promise.resolve({ buffer: Buffer.from('%PDF'), handle: 'lane-x' })
  },
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('public certificate routes under a rate limit', () => {
  let client: typeof import('@/db/client')

  beforeAll(async () => {
    client = await import('@/db/client')
  })

  beforeEach(() => {
    vi.stubEnv('APP_URL', 'https://glore.localhost')
    state.keys.length = 0
    state.limited.clear()
    state.pdf = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('answers 429 from the verification image without reading the certificate', async () => {
    const find = vi.spyOn(client.db.query.certificates, 'findFirst')
    state.limited.add('verify:')
    const { default: image } = await import('@/app/verify/[code]/opengraph-image')

    const response = await image({ params: Promise.resolve({ code: 'ABCD-EFGH-JKMN' }) })

    expect(response.status).toBe(429)
    expect(find).not.toHaveBeenCalled()
  })

  it('shares the verify limiter key with the verification page', async () => {
    state.limited.add('verify:')
    const { default: image } = await import('@/app/verify/[code]/opengraph-image')

    await image({ params: Promise.resolve({ code: 'ABCD-EFGH-JKMN' }) })

    expect(state.keys).toContain('verify:203.0.113.9')
  })

  it('answers 429 from the profile image without reading the user', async () => {
    const find = vi.spyOn(client.db.query.users, 'findFirst')
    state.limited.add('profile:')
    const { default: image } = await import('@/app/[username]/opengraph-image')

    const response = await image({ params: Promise.resolve({ username: 'someone' }) })

    expect(response.status).toBe(429)
    expect(find).not.toHaveBeenCalled()
  })

  it('limits the public profile lookup per address', async () => {
    const find = vi.spyOn(client.db.query.users, 'findFirst')
    const { findPublicCertificate } = await import('@/actions/certificates/queries')

    state.limited.add('profile:')
    expect(await findPublicCertificate('someone')).toMatchObject({ data: null, error: { code: 'RATE_LIMITED' } })
    expect(find).not.toHaveBeenCalled()

    state.limited.clear()
    expect(await findPublicCertificate('someone')).toMatchObject({ data: null, error: { code: 'NOT_FOUND' } })
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('limits the legacy handle lookup with the lookup limiter', async () => {
    const find = vi.spyOn(client.db.query.certificates, 'findFirst')
    const { lookupLegacyCertificateCode } = await import('@/actions/certificates/queries')

    state.limited.add('verify-lookup:')
    expect(await lookupLegacyCertificateCode('someone', 'legacy-handle')).toBeNull()
    expect(find).not.toHaveBeenCalled()

    state.limited.clear()
    expect(await lookupLegacyCertificateCode('someone', 'legacy-handle')).toBeNull()
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('limits the certificate PDF route per address before rendering', async () => {
    vi.doMock('@/actions/certificates/queries', async importOriginal => ({
      ...(await importOriginal<typeof import('@/actions/certificates/queries')>()),
      findCertificate: () => Promise.resolve({ data: { isRevoked: false }, error: null }),
    }))
    vi.resetModules()
    const { GET } = await import('@/app/api/v1/certificates/[id]/pdf/route')
    const request = new Request('https://glore.localhost/api/v1/certificates/7/pdf')
    const context = { params: Promise.resolve({ id: '7' }) }

    state.limited.add('certificate-pdf:')
    const limited = await GET(request, context)
    expect(limited.status).toBe(429)
    expect(limited.headers.get('retry-after')).toBeTruthy()
    expect(state.pdf).toBe(0)

    state.limited.clear()
    const allowed = await GET(request, context)
    expect(allowed.status).toBe(200)
    expect(state.pdf).toBe(1)
    vi.doUnmock('@/actions/certificates/queries')
  })
})
