import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { type CertificateSnapshot } from '@/db/schema'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const state = vi.hoisted(() => ({ organizationId: 0 }))
const storage = vi.hoisted(() => ({
  deleteQuietly: vi.fn((_urlOrKey: string) => Promise.resolve()),
  verify: vi.fn((key: string) => Promise.resolve(`https://r2.test/${key}`)),
}))

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))
vi.mock('@/actions/user', () => ({ findUser: vi.fn(), getCurrentUser: vi.fn() }))
vi.mock('@/actions/cookies', () => ({ deleteCookie: vi.fn(), getCookie: vi.fn(), setCookie: vi.fn() }))
vi.mock('@/actions/organizations/helpers', async importOriginal => ({
  ...(await importOriginal<typeof import('@/actions/organizations/helpers')>()),
  getFreshCurrentUser: vi.fn(() => Promise.resolve({ id: 'owner', organizations: [] })),
  getOrganizationAccess: vi.fn(() =>
    Promise.resolve({
      organizationId: state.organizationId,
      platform: false,
      role: 'admin',
      user: { id: 'owner', organizations: [] },
    })
  ),
  revalidateOrganizationMembers: vi.fn(() => Promise.resolve()),
}))
vi.mock('@/lib/storage', () => ({
  r2DeleteQuietly: storage.deleteQuietly,
  r2PresignAvatar: vi.fn(),
  r2PresignSignature: vi.fn(),
  r2VerifyAvatar: storage.verify,
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('organization branding assets', () => {
  const suffix = randomUUID().slice(0, 8)
  let context: {
    actions: typeof import('@/actions/organizations/settings')
    client: typeof import('@/db/client')
    schema: typeof import('@/db/schema')
  }

  const logo = `https://r2.test/organizations/branding-${suffix}-old.png`
  const signature = `https://r2.test/signatures/branding-${suffix}-old.png`

  const snapshot = (logoUrl: string | null, signatureUrl: string | null): CertificateSnapshot => ({
    activity: { duration: 120, endDate: '2026-06-30', location: 'Milan', startDate: '2026-01-10', tasks: ['Task'] },
    holder: { birthPlace: null, birthday: null, firstName: 'Holder', lastName: null, nationality: null },
    issuedAt: '2026-07-01T00:00:00.000Z',
    language: 'en',
    organization: { id: state.organizationId, legalRepresentative: null, logoUrl, name: 'Branding', signatureUrl },
    skills: [],
  })

  const issue = async (logoUrl: string | null, signatureUrl: string | null) =>
    await context.client.db.insert(context.schema.certificates).values({
      activityDescription: 'Helped',
      activityDuration: 120,
      activityEndDate: '2026-06-30',
      activityLocation: 'Milan',
      activityStartDate: '2026-01-10',
      handle: `branding-${suffix}-${randomUUID().slice(0, 8)}`,
      holderDeletedAt: new Date().toISOString(),
      language: 'en',
      organizationId: state.organizationId,
      snapshot: snapshot(logoUrl, signatureUrl),
      status: 'approved',
    })

  const setProfile = async (values: { avatarUrl: string | null; signatureUrl: string | null }) =>
    await context.client.db
      .update(context.schema.organizationProfiles)
      .set(values)
      .where(eq(context.schema.organizationProfiles.organizationId, state.organizationId))

  const profile = async () =>
    await context.client.db.query.organizationProfiles.findFirst({
      where: eq(context.schema.organizationProfiles.organizationId, state.organizationId),
    })

  const clearCertificates = async () =>
    await context.client.db
      .delete(context.schema.certificates)
      .where(eq(context.schema.certificates.organizationId, state.organizationId))

  beforeAll(async () => {
    const [actions, client, schema] = await Promise.all([
      import('@/actions/organizations/settings'),
      import('@/db/client'),
      import('@/db/schema'),
    ])
    context = { actions, client, schema }
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        city: 'Milan',
        email: `branding-${suffix}@settings.test`,
        handle: `branding-${suffix}`,
        name: 'Branding',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    state.organizationId = organization.id
    await client.db.insert(schema.organizationProfiles).values({ organizationId: organization.id })
  })

  beforeEach(async () => {
    storage.deleteQuietly.mockClear()
    await clearCertificates()
    await setProfile({ avatarUrl: logo, signatureUrl: signature })
  })

  afterAll(async () => {
    await clearCertificates()
    await context.client.db
      .delete(context.schema.organizations)
      .where(eq(context.schema.organizations.id, state.organizationId))
  })

  it('keeps a removed logo that an issued certificate snapshot still shows', async () => {
    await issue(logo, null)

    const { error } = await context.actions.removeOrganizationAvatar()

    expect(error).toBeNull()
    expect((await profile())?.avatarUrl).toBeNull()
    expect(storage.deleteQuietly).not.toHaveBeenCalled()
  })

  it('keeps a replaced logo that an issued certificate snapshot still shows', async () => {
    await issue(logo, null)

    const { error } = await context.actions.confirmOrganizationAvatar(`organizations/${state.organizationId}-new.png`)

    expect(error).toBeNull()
    expect((await profile())?.avatarUrl).toBe(`https://r2.test/organizations/${state.organizationId}-new.png`)
    expect(storage.deleteQuietly).not.toHaveBeenCalled()
  })

  it('keeps a removed signature that an issued certificate snapshot still shows', async () => {
    await issue(null, signature)

    const { error } = await context.actions.removeOrganizationSignature()

    expect(error).toBeNull()
    expect((await profile())?.signatureUrl).toBeNull()
    expect(storage.deleteQuietly).not.toHaveBeenCalled()
  })

  it('keeps a replaced signature that an issued certificate snapshot still shows', async () => {
    await issue(null, signature)

    const { error } = await context.actions.confirmOrganizationSignature(`signatures/${state.organizationId}-new.png`)

    expect(error).toBeNull()
    expect(storage.deleteQuietly).not.toHaveBeenCalled()
  })

  it('still deletes an old logo and signature that no snapshot references', async () => {
    await issue(`${logo}.other`, `${signature}.other`)

    await context.actions.removeOrganizationAvatar()
    await context.actions.removeOrganizationSignature()

    expect(storage.deleteQuietly.mock.calls.map(([url]) => url)).toEqual([logo, signature])
  })

  it('accepts only http and https website addresses', async () => {
    const blank = [
      'address',
      'country',
      'legalName',
      'legalRepresentative',
      'phone',
      'postcode',
      'region',
      'registryId',
    ]
    const input = {
      ...Object.fromEntries(blank.map(field => [field, ''])),
      city: 'Milan',
      description: {},
      email: `branding-${suffix}@settings.test`,
      name: 'Branding',
    } as Omit<Parameters<typeof context.actions.updateOrganization>[0], 'url'>
    const website = async () => (await profile())?.url

    const rejected = await context.actions.updateOrganization({ ...input, url: ['javascript', 'alert(1)'].join(':') })
    expect(rejected.error?.code).toBe('INVALID')
    expect(await website()).toBeNull()

    const accepted = await context.actions.updateOrganization({ ...input, url: 'https://example.org' })
    expect(accepted.error).toBeNull()
    expect(await website()).toBe('https://example.org')
  })
})
