'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag } from 'next/cache'

import { count, eq } from 'drizzle-orm'
import { type z } from 'zod'

import { expireOrganizations } from '@/actions/admin/expire'
import { adminAction, requireAdmin, requireAdminWithLimit } from '@/actions/admin/helpers'
import { notify } from '@/actions/notifications/notify'
import { listOrganizationActivity } from '@/actions/organizations/activity-core'
import { memberUserColumns, reviewerColumns } from '@/actions/organizations/helpers'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { adminError } from '@/db/mutations/moderation'
import {
  approveOrganizationApplication,
  createOrganization as createOrganizationMutation,
  createOrganizationWithAdminInvitation,
  rejectOrganizationApplication,
} from '@/db/mutations/organization'
import {
  createOrganizationInputSchema,
  inviteOrganizationInputSchema,
  organizationHandle,
  organizationIdSchema,
  reviewCommentSchema,
} from '@/db/queries/admin-organization'
import { parseAdminOrganization, parseOrganization, parseOrganizationInvitation } from '@/db/queries/organization'
import { toPipeline } from '@/db/queries/organization-insights'
import {
  certificates,
  memberships,
  organizationInvitations,
  organizationJoinRequests,
  organizations,
} from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import config from '~/config/app.json'

const loadOrganizations = () =>
  safeQuery(async () => {
    const [rows, requests, memberCounts] = await Promise.all([
      db.query.organizations.findMany({
        orderBy: (record, { desc: orderDesc }) => [orderDesc(record.createdAt)],
        with: {
          profile: true,
        },
        limit: 1000,
      }),
      db.query.organizationJoinRequests.findMany({
        columns: {
          createdAt: true,
          email: true,
          firstName: true,
          id: true,
          lastName: true,
          locale: true,
          message: true,
          organizationId: true,
          role: true,
          status: true,
          updatedAt: true,
          acceptedAt: true,
          rejectedAt: true,
          reviewedAt: true,
          reviewedBy: true,
          reviewerComment: true,
          userId: true,
          inviteLinkId: true,
        },
        where: eq(organizationJoinRequests.role, 'admin'),
        limit: 1000,
      }),
      db
        .select({ organizationId: memberships.organizationId, total: count() })
        .from(memberships)
        .groupBy(memberships.organizationId),
    ])

    const requestMap = new Map(requests.map(r => [r.organizationId, r]))
    const countMap = new Map(memberCounts.map(m => [m.organizationId, m.total]))

    return rows.map(org =>
      parseAdminOrganization({
        ...org,
        memberCount: countMap.get(org.id) ?? 0,
        registrationRequest: requestMap.get(org.id) ?? null,
      })
    )
  })

const fetchOrganizations = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations)

  return await loadOrganizations()
}

const uniqueHandle = async (name: string) => {
  const handle = organizationHandle(name)
  const existing = await db.query.organizations.findFirst({
    columns: { id: true },
    where: eq(organizations.handle, handle),
  })
  return existing ? `${handle}-${randomBytes(3).toString('hex')}` : handle
}

export const getOrganizations = async ({ cache = true }: { cache?: boolean } = {}) => {
  const admin = await adminAction(requireAdmin)
  if (admin.error) return { data: null, error: admin.error }

  if (!cache) return await loadOrganizations()

  return await fetchOrganizations()
}

export const approveOrganization = async (organizationId: number, reviewerComment?: string) =>
  await adminAction(async () => {
    const admin = await requireAdminWithLimit('organization-approve', 60)
    const id = organizationIdSchema.safeParse(organizationId)
    const comment = reviewCommentSchema.safeParse(reviewerComment)
    if (!(id.success && comment.success)) throw adminError('INVALID_INPUT')

    const { event } = await transaction(tx =>
      approveOrganizationApplication(tx, {
        comment: comment.data,
        expiryDays: config.invitationExpiryDays,
        organizationId: id.data,
        reviewerId: admin.id,
      })
    )
    expireOrganizations()
    await notify(event)

    return { organizationId: id.data, organizationName: event.data.organizationName }
  })

export const rejectOrganization = async (organizationId: number, reviewerComment?: string) =>
  await adminAction(async () => {
    const admin = await requireAdminWithLimit('organization-reject', 60)
    const id = organizationIdSchema.safeParse(organizationId)
    const comment = reviewCommentSchema.safeParse(reviewerComment)
    if (!(id.success && comment.success)) throw adminError('INVALID_INPUT')

    const { event } = await transaction(tx =>
      rejectOrganizationApplication(tx, {
        comment: comment.data,
        organizationId: id.data,
        reviewerId: admin.id,
      })
    )
    expireOrganizations()
    await notify(event)

    return { organizationId: id.data, organizationName: event.data.organizationName }
  })

export const inviteOrganization = async (input: z.input<typeof inviteOrganizationInputSchema>) =>
  await adminAction(async () => {
    const admin = await requireAdminWithLimit('organization-invite', 30)
    const parsed = inviteOrganizationInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { city, country, email, name, registrantEmail, url } = parsed.data
    const handle = await uniqueHandle(name)

    const { event, organization } = await transaction(tx =>
      createOrganizationWithAdminInvitation(tx, {
        admin: {
          email: registrantEmail,
          expiryDays: config.invitationExpiryDays,
          invitedById: admin.id,
          locale: admin.locale,
        },
        organization: { approvedAt: new Date().toISOString(), city, country, email, handle, name, url },
      })
    )
    expireOrganizations()
    await notify(event)

    return { organizationId: organization.id, organizationName: organization.name }
  })

export const createOrganization = async (input: z.input<typeof createOrganizationInputSchema>) =>
  await adminAction(async () => {
    await requireAdminWithLimit('organization-create', 30)
    const parsed = createOrganizationInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { city, country, email, name, url } = parsed.data
    const handle = await uniqueHandle(name)

    const created = await transaction(tx =>
      createOrganizationMutation(tx, { approvedAt: new Date().toISOString(), city, country, email, handle, name, url })
    )
    expireOrganizations()

    return created
  })

export const getAdminOrganizationName = async (organizationId: number) => {
  const admin = await adminAction(requireAdmin)
  const id = organizationIdSchema.safeParse(organizationId)
  if (admin.error || !id.success) return null

  const { data } = await safeQuery(() =>
    db.query.organizations.findFirst({ columns: { name: true }, where: eq(organizations.id, id.data) })
  )
  return data?.name ?? null
}

export const getAdminOrganization = async (organizationId: number) => {
  const admin = await adminAction(requireAdmin)
  if (admin.error) return { data: null, error: admin.error }
  const id = organizationIdSchema.safeParse(organizationId)
  if (!id.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'These values are not valid' } }

  return await safeQuery(async () => {
    const [record, membershipRecords, invitationRecords, pipelineRows, activity] = await Promise.all([
      db.query.organizations.findFirst({
        with: { joinRequests: true, profile: true },
        where: eq(organizations.id, id.data),
      }),
      db.query.memberships.findMany({
        where: eq(memberships.organizationId, id.data),
        with: { user: { columns: memberUserColumns } },
        orderBy: (records, { asc }) => [asc(records.role), asc(records.createdAt)],
        limit: 500,
      }),
      db.query.organizationInvitations.findMany({
        where: eq(organizationInvitations.organizationId, id.data),
        with: { invitedBy: { columns: reviewerColumns } },
        orderBy: (records, { desc: orderDesc }) => [orderDesc(records.createdAt)],
        limit: 200,
      }),
      db
        .select({ status: certificates.status, total: count() })
        .from(certificates)
        .where(eq(certificates.organizationId, id.data))
        .groupBy(certificates.status),
      listOrganizationActivity(id.data),
    ])

    if (!record) {
      throw new Error('Organization not found')
    }

    return {
      ...parseOrganization({ ...record, memberships: membershipRecords }),
      activity,
      currentUserId: admin.data.id,
      invitations: invitationRecords.map(invitation => parseOrganizationInvitation(invitation)),
      pipeline: toPipeline(pipelineRows),
    }
  })
}
