import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applicationSchema } from '@/db/queries/organization-application'
import { CacheTag } from '@/lib/cache'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const updateTag = vi.hoisted(() => vi.fn())
const viewer = vi.hoisted(() => ({ id: '' }))

vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))
vi.mock('@/actions/user', () => ({
  getCurrentUser: () => Promise.resolve({ id: viewer.id, isAdmin: true }),
}))
vi.mock('next/cache', async importOriginal => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag,
}))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('admin organization decisions', () => {
  const suffix = randomUUID().slice(0, 8)
  const reviewerId = randomUUID()
  const organizationIds: number[] = []
  let context: {
    actions: typeof import('@/actions/admin/organizations')
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/organization')
    schema: typeof import('@/db/schema')
  }

  const submit = async (label: string) => {
    const application = applicationSchema.parse({
      charterAccepted: true,
      city: 'Milan',
      country: 'it',
      email: `${label}-${suffix}@decisions.test`,
      firstName: 'Maria',
      lastName: 'Rossi',
      legalName: 'Example APS',
      motivation: 'We run exchanges for young people and want certificates.',
      name: `Decision ${label} ${suffix}`,
      registrantEmail: `${label}-${suffix}@applicants.test`,
      registryId: 'IT-123',
      volunteersPerYear: '40',
    })
    const result = await context.client.transaction(tx =>
      context.mutations.submitOrganizationApplication(tx, { application, handle: `decision-${label}-${suffix}` })
    )
    organizationIds.push(result.organization.id)
    return result.organization.id
  }

  beforeAll(async () => {
    const [actions, client, mutations, schema] = await Promise.all([
      import('@/actions/admin/organizations'),
      import('@/db/client'),
      import('@/db/mutations/organization'),
      import('@/db/schema'),
    ])
    viewer.id = reviewerId
    await client.db.insert(schema.users).values({
      email: `reviewer-${suffix}@decisions.test`,
      firstName: 'Reviewer',
      id: reviewerId,
      name: 'Reviewer',
      onboardedAt: new Date().toISOString(),
    })
    context = { actions, client, mutations, schema }
  })

  afterAll(async () => {
    const { client, schema } = context
    for (const id of organizationIds) {
      await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, id))
      await client.db
        .delete(schema.organizationInvitations)
        .where(eq(schema.organizationInvitations.organizationId, id))
      await client.db.delete(schema.organizations).where(eq(schema.organizations.id, id))
    }
    await client.db.delete(schema.users).where(eq(schema.users.id, reviewerId))
  })

  it('expires the sidebar badge tag right after an approval', async () => {
    updateTag.mockClear()
    const id = await submit('approve')
    const result = await context.actions.approveOrganization(id)

    expect(result.error).toBeFalsy()
    expect(updateTag).toHaveBeenCalledWith(CacheTag.Organizations)
  })

  it('expires the sidebar badge tag right after a rejection', async () => {
    updateTag.mockClear()
    const id = await submit('reject')
    const result = await context.actions.rejectOrganization(id, 'Not a fit')

    expect(result.error).toBeFalsy()
    expect(updateTag).toHaveBeenCalledWith(CacheTag.Organizations)
  })

  it('reads the organization name for the page title', async () => {
    const id = await submit('title')

    expect(await context.actions.getAdminOrganizationName(id)).toBe(`Decision title ${suffix}`)
    expect(await context.actions.getAdminOrganizationName(2_000_000_000)).toBeNull()
  })
})
