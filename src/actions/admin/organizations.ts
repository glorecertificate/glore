'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag, revalidateTag } from 'next/cache'

import { and, count, eq } from 'drizzle-orm'

import { notify } from '@/actions/notifications/notify'
import {
  expireUserAccess,
  getDescriptionRecord,
  getOrganizationAdminsCount,
  listOrganizationMemberIds,
  memberUserColumns,
  revalidateOrganizationMembers,
} from '@/actions/organizations/helpers'
import {
  type InviteInput,
  dedupeEmails,
  failure,
  guarded,
  inviteSchema,
  sendInvitations,
} from '@/actions/organizations/invite-core'
import { getCurrentUser } from '@/actions/user'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { invitationError } from '@/db/mutations/invitation'
import {
  approveOrganizationApplication,
  createOrganization as createOrganizationMutation,
  createOrganizationWithAdminInvitation,
  removeMembership,
  updateOrganization as updateOrganizationMutation,
} from '@/db/mutations/organization'
import {
  type OrganizationMembershipRole,
  parseAdminOrganization,
  parseOrganization,
  parseOrganizationMember,
} from '@/db/queries/organization'
import { certificates, memberships, organizationJoinRequests, organizationProfiles, organizations } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { r2DeleteQuietly, r2PresignAvatar, r2VerifyAvatar } from '@/lib/storage'
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

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const rejectOrganization = async (organizationId: number, reviewerComment?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can reject organizations' }

  const result = await safeQuery(async () => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    const request = await db.query.organizationJoinRequests.findFirst({
      where: and(
        eq(organizationJoinRequests.organizationId, organizationId),
        eq(organizationJoinRequests.role, 'admin'),
        eq(organizationJoinRequests.status, 'pending')
      ),
    })

    if (!request) {
      throw new Error('Registration request not found')
    }

    const nextComment = reviewerComment?.trim() || null
    const now = new Date().toISOString()

    await db
      .update(organizationJoinRequests)
      .set({
        rejectedAt: now,
        reviewedAt: now,
        reviewedBy: currentUser.id,
        reviewerComment: nextComment,
        status: 'rejected',
      })
      .where(eq(organizationJoinRequests.id, request.id))

    await sendMail({
      to: request.email,
      locale: request.locale ?? undefined,
      template: {
        name: 'organization/join-request',
        props: { organizationName: org.name, status: 'rejected', comment: nextComment, userName: request.firstName },
      },
    }).catch(() => null)

    return { organizationId, organizationName: org.name }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

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
          url: url?.trim() || null,
        },
      })
    )
    await notify(event)

    return { organizationId: organization.id, organizationName: organization.name }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

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
        url: url?.trim() || null,
      })
    )
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const getAdminOrganization = async (organizationId: number) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  return await safeQuery(async () => {
    const [record, membershipRecords] = await Promise.all([
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
    ])

    if (!record) {
      throw new Error('Organization not found')
    }

    return {
      ...parseOrganization({ ...record, memberships: membershipRecords }),
      currentUserId: currentUser.id,
    }
  })
}

export const updateAdminOrganization = async (
  organizationId: number,
  {
    address,
    city,
    country,
    description,
    email: orgEmail,
    name,
    phone,
    postcode,
    region,
    url,
  }: {
    address: string
    city: string
    country: string
    description: string
    email: string
    name: string
    phone: string
    postcode: string
    region: string
    url: string
  }
) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can update organizations' }

  const result = await safeQuery(async () => {
    const current = await db.query.organizations.findFirst({
      with: { profile: { columns: { description: true } } },
      where: eq(organizations.id, organizationId),
    })

    if (!current) {
      throw new Error('Organization not found')
    }

    await transaction(tx =>
      updateOrganizationMutation(tx, organizationId, {
        address: address.trim() || null,
        city: city.trim(),
        country: country.trim() || null,
        description: getDescriptionRecord(
          description.trim(),
          currentUser.locale ?? undefined,
          current.profile?.description ?? null
        ),
        email: orgEmail.trim().toLowerCase(),
        name: name.trim(),
        phone: phone.trim() || null,
        postcode: postcode.trim() || null,
        region: region.trim() || null,
        url: url.trim() || null,
      })
    )

    return { organizationId }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const createAdminOrganizationAvatarUploadUrl = async (
  organizationId: number,
  contentType: string,
  size: number
) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Forbidden' }

  try {
    return { data: await r2PresignAvatar(`organizations/${organizationId}`, contentType, size) }
  } catch {
    return { error: 'Invalid image' }
  }
}

export const confirmAdminOrganizationAvatar = async (organizationId: number, key: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Forbidden' }
  if (!key.startsWith(`organizations/${organizationId}-`)) return { error: 'Invalid key' }

  const result = await safeQuery(async () => {
    const avatarUrl = await r2VerifyAvatar(key)
    const current = await db.query.organizationProfiles.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizationProfiles.organizationId, organizationId),
    })

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl, organizationId })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { avatarUrl } })

    if (current?.avatarUrl) {
      await r2DeleteQuietly(current.avatarUrl)
    }

    return { avatarUrl }
  })

  if (!result.error) await revalidateOrganizationMembers(organizationId)

  return result
}

export const removeAdminOrganizationAvatar = async (organizationId: number) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Forbidden' }

  const result = await safeQuery(async () => {
    const current = await db.query.organizationProfiles.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizationProfiles.organizationId, organizationId),
    })

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: null, organizationId })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { avatarUrl: null } })

    if (current?.avatarUrl) {
      await r2DeleteQuietly(current.avatarUrl)
    }

    return { avatarUrl: null }
  })

  if (!result.error) await revalidateOrganizationMembers(organizationId)

  return result
}

export const inviteAdminOrganizationMembers = async (organizationId: number, input: InviteInput) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return failure('FORBIDDEN')

  const result = await guarded(async () => {
    const parsed = inviteSchema.safeParse(input)
    if (!parsed.success) throw invitationError('INVALID')

    const org = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.id, organizationId),
    })
    if (!org) throw invitationError('NOT_FOUND')

    const { emails, locale, message, role } = parsed.data
    const unique = dedupeEmails(emails)
    if (unique.length > config.maxBulkInvites) throw invitationError('INVALID')

    return await sendInvitations({ actorId: currentUser.id, emails: unique, locale, message, organizationId, role })
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const updateAdminOrganizationMemberRole = async (
  organizationId: number,
  membershipId: number,
  role: OrganizationMembershipRole
) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Forbidden' } }

  const result = await safeQuery(async () => {
    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)),
      with: { user: { columns: memberUserColumns } },
    })

    if (!membership) {
      throw new Error('Member not found')
    }

    if (membership.role === 'admin' && role !== 'admin') {
      const adminCount = await getOrganizationAdminsCount(organizationId)
      if (adminCount <= 1) {
        throw new Error('At least one organization admin is required')
      }
    }

    if (role === 'admin' && membership.role !== 'admin') {
      const adminCount = await getOrganizationAdminsCount(organizationId)
      if (adminCount > 0) {
        throw new Error('An organization admin already exists. Only one admin is allowed per organization.')
      }
    }

    await db.update(memberships).set({ role }).where(eq(memberships.id, membership.id))
    expireUserAccess([membership.userId])

    return parseOrganizationMember({ ...membership, role })
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const removeAdminOrganizationMember = async (organizationId: number, membershipId: number) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Forbidden' } }

  const result = await safeQuery(async () => {
    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)),
    })

    if (!membership) {
      throw new Error('Member not found')
    }

    if (membership.role === 'admin') {
      const adminCount = await getOrganizationAdminsCount(organizationId)
      if (adminCount <= 1) {
        throw new Error('At least one organization admin is required')
      }
    }

    const { events } = await transaction(tx =>
      removeMembership(tx, { actorId: currentUser.id, membershipId: membership.id, organizationId })
    )
    await Promise.all(events.map(event => notify(event)))
    expireUserAccess([membership.userId])

    return { id: membership.id, userId: membership.userId }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const deleteAdminOrganization = async (organizationId: number) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Forbidden' } }

  const result = await safeQuery(async () => {
    const org = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    const [certificateCount] = await db
      .select({ total: count() })
      .from(certificates)
      .where(eq(certificates.organizationId, organizationId))

    if ((certificateCount?.total ?? 0) > 0) {
      throw new Error('Organizations with certificates cannot be deleted')
    }

    const [memberIds, profile] = await Promise.all([
      listOrganizationMemberIds(organizationId),
      db.query.organizationProfiles.findFirst({
        columns: { avatarUrl: true },
        where: eq(organizationProfiles.organizationId, organizationId),
      }),
    ])
    await db.delete(organizations).where(eq(organizations.id, organizationId))
    expireUserAccess(memberIds)
    if (profile?.avatarUrl) await r2DeleteQuietly(profile.avatarUrl)

    return { organizationId }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}
