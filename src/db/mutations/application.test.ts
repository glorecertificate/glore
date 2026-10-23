import { randomUUID } from 'node:crypto'

import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { applicationSchema } from '@/db/queries/organization-application'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

vi.mock('@/actions/notifications/notify', () => ({ notify: vi.fn() }))

const isLocalDatabase = LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? '')

const valid = {
  charterAccepted: true,
  city: 'Milan',
  country: 'it',
  email: 'INFO@Example.org',
  firstName: 'Maria',
  lastName: 'Rossi',
  legalName: 'Example APS',
  motivation: 'We run exchanges for young people and want certificates.',
  name: 'Example',
  registrantEmail: 'maria@example.org',
  registryId: 'IT-123',
  volunteersPerYear: '40',
}

describe('applicationSchema', () => {
  it('normalizes a valid application', () => {
    const parsed = applicationSchema.safeParse({ ...valid, contactEmail: '', contactName: '', url: '' })
    expect(parsed.success).toBe(true)
    expect(parsed.data).toMatchObject({
      contactEmail: null,
      contactName: null,
      email: 'info@example.org',
      url: null,
      volunteersPerYear: 40,
    })
  })

  it('requires the Quality Charter', () => {
    const parsed = applicationSchema.safeParse({ ...valid, charterAccepted: false })
    expect(parsed.error?.issues[0]?.message).toBe('charter')
  })

  it('reports field level codes', () => {
    const parsed = applicationSchema.safeParse({
      ...valid,
      contactEmail: 'nope',
      legalName: '',
      motivation: 'short',
      url: 'ftp://x',
      volunteersPerYear: '0',
    })
    const codes = Object.fromEntries(parsed.error?.issues.map(issue => [issue.path.join('.'), issue.message]) ?? [])
    expect(codes).toMatchObject({
      contactEmail: 'email',
      legalName: 'required',
      motivation: 'tooShort',
      url: 'url',
      volunteersPerYear: 'number',
    })
  })
})

describe.skipIf(!isLocalDatabase)('organization applications', () => {
  const suffix = randomUUID().slice(0, 8)
  const reviewerId = randomUUID()
  let context: {
    client: typeof import('@/db/client')
    mutations: typeof import('@/db/mutations/organization')
    schema: typeof import('@/db/schema')
  }
  const organizationIds: number[] = []

  const submit = async (label: string) => {
    const application = applicationSchema.parse({
      ...valid,
      contactEmail: `contact-${label}-${suffix}@example.org`,
      contactName: 'Carla Contact',
      name: `Application ${label} ${suffix}`,
      registrantEmail: `${label}-${suffix}@applicants.test`,
      url: 'https://example.org',
    })
    const result = await context.client.transaction(tx =>
      context.mutations.submitOrganizationApplication(tx, { application, handle: `application-${label}-${suffix}` })
    )
    organizationIds.push(result.organization.id)
    return result
  }

  beforeAll(async () => {
    const [client, mutations, schema] = await Promise.all([
      import('@/db/client'),
      import('@/db/mutations/organization'),
      import('@/db/schema'),
    ])
    await client.db.insert(schema.users).values({
      email: `reviewer-${suffix}@applicants.test`,
      firstName: 'Reviewer',
      id: reviewerId,
      name: 'Reviewer',
      onboardedAt: new Date().toISOString(),
    })
    context = { client, mutations, schema }
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

  it('stores the application, a pending request, and the received event', async () => {
    const { event, organization } = await submit('received')
    const { db } = context.client
    const { activityEvents, organizationJoinRequests, organizationProfiles, organizations } = context.schema

    const [row] = await db.select().from(organizations).where(eq(organizations.id, organization.id))
    expect(row?.approvedAt).toBeNull()
    const profile = await db.query.organizationProfiles.findFirst({
      where: eq(organizationProfiles.organizationId, organization.id),
    })
    expect(profile).toMatchObject({
      contactName: 'Carla Contact',
      legalName: 'Example APS',
      legalRepresentative: 'Maria Rossi',
      registryId: 'IT-123',
      volunteersPerYear: 40,
    })
    expect(profile?.charterAcceptedAt).not.toBeNull()
    const request = await db.query.organizationJoinRequests.findFirst({
      where: and(
        eq(organizationJoinRequests.organizationId, organization.id),
        eq(organizationJoinRequests.role, 'admin')
      ),
    })
    expect(request).toMatchObject({ firstName: 'Maria', status: 'pending' })
    const events = await db.select().from(activityEvents).where(eq(activityEvents.organizationId, organization.id))
    expect(events.map(item => item.action)).toEqual(['organization.application_received'])
    expect(events[0]?.metadata).not.toHaveProperty('applicantEmail')
    expect(event.data.applicantName).toBe('Maria Rossi')
  })

  it('rejects once, records the decision, and keeps the organization', async () => {
    const { organization } = await submit('rejected')
    const reject = () =>
      context.client.transaction(tx =>
        context.mutations.rejectOrganizationApplication(tx, {
          comment: 'Not a fit',
          organizationId: organization.id,
          reviewerId,
        })
      )
    const { event } = await reject()
    expect(event.data).toMatchObject({ approved: false, comment: 'Not a fit', invitationUrl: null })
    const request = await context.client.db.query.organizationJoinRequests.findFirst({
      where: eq(context.schema.organizationJoinRequests.organizationId, organization.id),
    })
    expect(request).toMatchObject({ reviewedBy: reviewerId, status: 'rejected' })
    await expect(reject()).rejects.toThrow('Registration request not found')
    const stored = await context.client.db.query.organizations.findFirst({
      where: eq(context.schema.organizations.id, organization.id),
    })
    expect(stored?.approvedAt).toBeNull()
  })

  it('approves into an invitation for the applicant', async () => {
    const { organization } = await submit('approved')
    const { event } = await context.client.transaction(tx =>
      context.mutations.approveOrganizationApplication(tx, {
        comment: null,
        expiryDays: 7,
        organizationId: organization.id,
        reviewerId,
      })
    )
    expect(event.data).toMatchObject({ approved: true })
    expect(event.data.invitationUrl).toContain('/invite/')
    const stored = await context.client.db.query.organizations.findFirst({
      where: eq(context.schema.organizations.id, organization.id),
    })
    expect(stored?.approvedAt).not.toBeNull()
    const memberRows = await context.client.db.query.memberships.findMany({
      where: eq(context.schema.memberships.organizationId, organization.id),
    })
    expect(memberRows).toHaveLength(0)
  })

  describe('concurrent decisions', () => {
    const approve = (organizationId: number) =>
      context.client.transaction(tx =>
        context.mutations.approveOrganizationApplication(tx, {
          comment: null,
          expiryDays: 7,
          organizationId,
          reviewerId,
        })
      )

    const reject = (organizationId: number) =>
      context.client.transaction(tx =>
        context.mutations.rejectOrganizationApplication(tx, { comment: null, organizationId, reviewerId })
      )

    const decisions = async (organizationId: number) =>
      await context.client.db.query.activityEvents.findMany({
        where: and(
          eq(context.schema.activityEvents.organizationId, organizationId),
          eq(context.schema.activityEvents.action, 'organization.application_decided')
        ),
      })

    it('lets only one of two simultaneous approvals through', async () => {
      const { organization } = await submit('race-approve')

      const results = await Promise.allSettled([approve(organization.id), approve(organization.id)])

      expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
      expect(await decisions(organization.id)).toHaveLength(1)
    })

    it('lets only one of two simultaneous rejections through', async () => {
      const { organization } = await submit('race-reject')

      const results = await Promise.allSettled([reject(organization.id), reject(organization.id)])

      expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
      expect(await decisions(organization.id)).toHaveLength(1)
    })

    it('lets only one of a simultaneous approval and rejection through', async () => {
      const { organization } = await submit('race-mixed')

      const results = await Promise.allSettled([approve(organization.id), reject(organization.id)])

      expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
      expect(await decisions(organization.id)).toHaveLength(1)
    })

    it('reports the lost race with a conflict code', async () => {
      const { organization } = await submit('race-code')
      const stale = await context.client.db.query.organizationJoinRequests.findFirst({
        where: eq(context.schema.organizationJoinRequests.organizationId, organization.id),
      })
      await approve(organization.id)
      await context.client.db
        .update(context.schema.organizationJoinRequests)
        .set({ status: 'pending' })
        .where(eq(context.schema.organizationJoinRequests.id, stale?.id ?? 0))
      await context.client.db
        .update(context.schema.organizations)
        .set({ approvedAt: null })
        .where(eq(context.schema.organizations.id, organization.id))

      const results = await Promise.allSettled([approve(organization.id), approve(organization.id)])

      expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
      const lost = results.find(({ status }) => status === 'rejected')
      expect(lost?.status === 'rejected' && lost.reason).toMatchObject({ code: 'CONFLICT' })
    })
  })
})
