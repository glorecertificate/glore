import { randomUUID } from 'node:crypto'

import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const suffix = randomUUID().slice(0, 8)
const email = (name: string) => `${name}-${suffix}@join.test`

describe.skipIf(!isLocalDatabase)('invite link preview membership', () => {
  let context: {
    client: typeof import('@/db/client')
    previews: typeof import('@/actions/organizations/previews')
    schema: typeof import('@/db/schema')
    ids: Record<'member' | 'outsider' | 'owner', string>
    organizationId: number
    token: string
  }

  beforeAll(async () => {
    const [client, invitations, previews, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/invitation'),
      import('@/actions/organizations/previews'),
      import('@/db/schema'),
    ])
    const ids = { member: randomUUID(), outsider: randomUUID(), owner: randomUUID() }
    for (const [key, id] of Object.entries(ids)) {
      await client.db
        .insert(schema.users)
        .values({ email: email(key), firstName: key, id, name: key, onboardedAt: new Date().toISOString() })
    }
    const [organization] = await client.db
      .insert(schema.organizations)
      .values({
        approvedAt: new Date().toISOString(),
        city: 'Milan',
        email: email('org'),
        handle: `join-test-${suffix}`,
        name: 'Join Test',
      })
      .returning({ id: schema.organizations.id })
    if (!organization) throw new Error('Failed to create the test organization')
    await client.db.insert(schema.memberships).values([
      { organizationId: organization.id, role: 'admin', userId: ids.owner },
      { organizationId: organization.id, role: 'volunteer', userId: ids.member },
    ])
    const { token } = await client.transaction(tx =>
      invitations.createInviteLink(tx, {
        createdById: ids.owner,
        expiryDays: 7,
        maxUses: null,
        organizationId: organization.id,
        requiresApproval: false,
        role: 'volunteer',
      })
    )
    context = { client, ids, organizationId: organization.id, previews, schema, token }
  })

  afterAll(async () => {
    const { client, ids, organizationId, schema } = context
    await client.db.delete(schema.activityEvents).where(eq(schema.activityEvents.organizationId, organizationId))
    await client.db.delete(schema.organizations).where(eq(schema.organizations.id, organizationId))
    await client.db.delete(schema.users).where(inArray(schema.users.id, Object.values(ids)))
  })

  it('is not a member without a user', async () => {
    const preview = await context.previews.getInviteLinkPreview(context.token)

    expect(preview?.isMember).toBe(false)
  })

  it('is not a member when only another user belongs to the organization', async () => {
    const preview = await context.previews.getInviteLinkPreview(context.token, context.ids.outsider)

    expect(preview?.isMember).toBe(false)
  })

  it('is a member with the caller own membership', async () => {
    const preview = await context.previews.getInviteLinkPreview(context.token, context.ids.member)

    expect(preview?.isMember).toBe(true)
  })
})
