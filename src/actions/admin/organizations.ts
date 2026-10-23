'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag } from 'next/cache'

import { count, eq } from 'drizzle-orm'

import { expireOrganizations } from '@/actions/admin/expire'
import { notify } from '@/actions/notifications/notify'
import { listOrganizationActivity } from '@/actions/organizations/activity-core'
import { memberUserColumns, reviewerColumns } from '@/actions/organizations/helpers'
import { getCurrentUser } from '@/actions/user'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  approveOrganizationApplication,
  createOrganization as createOrganizationMutation,
  createOrganizationWithAdminInvitation,
  rejectOrganizationApplication,
} from '@/db/mutations/organization'
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
import { optionalHttpUrl } from '@/lib/url'
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

export const getOrganizations = async ({ cache = true }: { cache?: boolean } = {}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  if (!cache) return await loadOrganizations()

  return await fetchOrganizations()
}

export const approveOrganization = async (organizationId: number, reviewerComment?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can approve organizations' }

  const result = await safeQuery(async () => {
    const { event } = await transaction(tx =>
      approveOrganizationApplication(tx, {
        comment: reviewerComment?.trim() || null,
        expiryDays: config.invitationExpiryDays,
        organizationId,
        reviewerId: currentUser.id,
      })
    )
    await notify(event)

    return { organizationId, organizationName: event.data.organizationName }
  })

  if (!result.error) expireOrganizations()

  return result
}

export const rejectOrganization = async (organizationId: number, reviewerComment?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can reject organizations' }

  const result = await safeQuery(async () => {
    const { event } = await transaction(tx =>
      rejectOrganizationApplication(tx, {
        comment: reviewerComment?.trim() || null,
        organizationId,
        reviewerId: currentUser.id,
      })
    )
    await notify(event)

    return { organizationId, organizationName: event.data.organizationName }
  })

  if (!result.error) expireOrganizations()

  return result
}

export const inviteOrganization = async ({
  city,
  country,
  email: orgEmail,
  name,
  registrantEmail,
  url,
}: {
  city: string
  country: string
  email: string
  name: string
  registrantEmail: string
  url?: string
}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can invite organizations' }

  const website = optionalHttpUrl(500).safeParse(url ?? '')
  if (!website.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid website address' } }

  const result = await safeQuery(async () => {
    const handle = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '')

    const existing = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.handle, handle),
    })

    const { event, organization } = await transaction(tx =>
      createOrganizationWithAdminInvitation(tx, {
        admin: {
          email: registrantEmail,
          expiryDays: config.invitationExpiryDays,
          invitedById: currentUser.id,
          locale: currentUser.locale,
        },
        organization: {
          approvedAt: new Date().toISOString(),
          city: city.trim(),
          country: country.trim(),
          email: orgEmail.trim().toLowerCase(),
          handle: existing ? `${handle}-${randomBytes(3).toString('hex')}` : handle,
          name: name.trim(),
          url: website.data,
        },
      })
    )
    await notify(event)

    return { organizationId: organization.id, organizationName: organization.name }
  })

  if (!result.error) expireOrganizations()

  return result
}

export const createOrganization = async ({
  city,
  country,
  email: orgEmail,
  name,
  url,
}: {
  city: string
  country?: string
  email: string
  name: string
  url?: string
}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can create organizations' }

  const website = optionalHttpUrl(500).safeParse(url ?? '')
  if (!website.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid website address' } }

  const result = await safeQuery(async () => {
    const handle = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '')

    const existing = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.handle, handle),
    })

    const finalHandle = existing ? `${handle}-${randomBytes(3).toString('hex')}` : handle

    return await transaction(tx =>
      createOrganizationMutation(tx, {
        approvedAt: new Date().toISOString(),
        city: city.trim(),
        country: country?.trim() || null,
        email: orgEmail.trim().toLowerCase(),
        handle: finalHandle,
        name: name.trim(),
        url: website.data,
      })
    )
  })

  if (!result.error) expireOrganizations()

  return result
}

export const getAdminOrganizationName = async (organizationId: number) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return null

  const { data } = await safeQuery(() =>
    db.query.organizations.findFirst({ columns: { name: true }, where: eq(organizations.id, organizationId) })
  )
  return data?.name ?? null
}

export const getAdminOrganization = async (organizationId: number) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  return await safeQuery(async () => {
    const [record, membershipRecords, invitationRecords, pipelineRows, activity] = await Promise.all([
      db.query.organizations.findFirst({
        with: { joinRequests: true, profile: true },
        where: eq(organizations.id, organizationId),
      }),
      db.query.memberships.findMany({
        where: eq(memberships.organizationId, organizationId),
        with: { user: { columns: memberUserColumns } },
        orderBy: (records, { asc }) => [asc(records.role), asc(records.createdAt)],
        limit: 500,
      }),
      db.query.organizationInvitations.findMany({
        where: eq(organizationInvitations.organizationId, organizationId),
        with: { invitedBy: { columns: reviewerColumns } },
        orderBy: (records, { desc: orderDesc }) => [orderDesc(records.createdAt)],
        limit: 200,
      }),
      db
        .select({ status: certificates.status, total: count() })
        .from(certificates)
        .where(eq(certificates.organizationId, organizationId))
        .groupBy(certificates.status),
      listOrganizationActivity(organizationId),
    ])

    if (!record) {
      throw new Error('Organization not found')
    }

    return {
      ...parseOrganization({ ...record, memberships: membershipRecords }),
      activity,
      currentUserId: currentUser.id,
      invitations: invitationRecords.map(invitation => parseOrganizationInvitation(invitation)),
      pipeline: toPipeline(pipelineRows),
    }
  })
}
