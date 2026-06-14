'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag, revalidateTag } from 'next/cache'

import { and, count, eq } from 'drizzle-orm'

import {
  getDescriptionRecord,
  getOrganizationAdminsCount,
  memberUserColumns,
  sendOrganizationAccessEmail,
} from '@/actions/organizations/helpers'
import { getCurrentUser } from '@/actions/user'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  createOrganization as createOrganizationMutation,
  updateOrganization as updateOrganizationMutation,
} from '@/db/mutations/organization'
import {
  type OrganizationMembershipRole,
  parseAdminOrganization,
  parseOrganization,
  parseOrganizationMember,
} from '@/db/queries/organization'
import {
  certificates,
  memberships,
  organizationJoinRequests,
  organizationProfiles,
  organizations,
  users,
} from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { AVATAR_CONTENT_TYPES } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { r2Delete, r2PresignPut, r2Url } from '@/lib/storage'

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

  return await safeQuery(async () => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    if (org.approvedAt) {
      throw new Error('Organization is already approved')
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

    await db
      .update(organizations)
      .set({ approvedAt: new Date().toISOString() })
      .where(eq(organizations.id, organizationId))

    const existingUser = await db.query.users.findFirst({
      columns: { email: true, id: true, onboardedAt: true },
      where: eq(users.email, request.email),
    })

    const orgAdmin =
      existingUser ??
      (
        await auth.api.signUpEmail({
          body: {
            email: request.email,
            firstName: request.firstName,
            lastName: request.lastName ?? undefined,
            locale: request.locale ?? DEFAULT_LOCALE,
            name: [request.firstName, request.lastName].filter(Boolean).join(' '),
            password: randomBytes(16).toString('hex'),
          },
        })
      )?.user

    if (!orgAdmin?.id) {
      throw new Error('Failed to create admin account')
    }

    const existingMembership = await db.query.memberships.findFirst({
      where: and(eq(memberships.organizationId, organizationId), eq(memberships.userId, orgAdmin.id)),
    })

    if (!existingMembership) {
      await db.insert(memberships).values({
        organizationId,
        role: 'admin',
        userId: orgAdmin.id,
      })
    }

    await db
      .update(organizationJoinRequests)
      .set({
        acceptedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        reviewerComment: reviewerComment?.trim() || null,
        status: 'accepted',
      })
      .where(eq(organizationJoinRequests.id, request.id))

    if (!existingUser || !existingUser.onboardedAt) {
      await auth.api
        .requestPasswordReset({
          body: {
            email: request.email,
            redirectTo: `${process.env.APP_URL}/login`,
          },
        })
        .catch(() => null)
    }

    await sendMail({
      to: request.email,
      template: {
        name: 'organization/join-request',
        props: { organizationName: org.name, status: 'accepted', userName: request.firstName },
      },
    }).catch(() => null)

    return { organizationId, organizationName: org.name }
  })
}

export const rejectOrganization = async (organizationId: number, reviewerComment?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can reject organizations' }

  return await safeQuery(async () => {
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

    const nextComment = reviewerComment?.trim() || null

    if (request) {
      await sendMail({
        to: request.email,
        template: {
          name: 'organization/join-request',
          props: { organizationName: org.name, status: 'rejected', comment: nextComment, userName: request.firstName },
        },
      }).catch(() => null)
    }

    await db.delete(organizations).where(eq(organizations.id, organizationId))

    return { organizationId }
  })
}

export const inviteOrganization = async ({
  city,
  country,
  email: orgEmail,
  firstName,
  lastName,
  locale,
  name,
  registrantEmail,
  url,
}: {
  city: string
  country: string
  email: string
  firstName: string
  lastName?: string
  locale?: string
  name: string
  registrantEmail: string
  url?: string
}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can invite organizations' }

  return await safeQuery(async () => {
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

    const now = new Date().toISOString()

    const [org] = await db
      .insert(organizations)
      .values({
        approvedAt: now,
        city: city.trim(),
        email: orgEmail.trim().toLowerCase(),
        handle: finalHandle,
        name: name.trim(),
      })
      .returning({ id: organizations.id, name: organizations.name })

    if (!org) {
      throw new Error('Failed to create organization')
    }

    await db.insert(organizationProfiles).values({
      country: country.trim(),
      organizationId: org.id,
      url: url?.trim() || null,
    })

    const existingUser = await db.query.users.findFirst({
      columns: { email: true, id: true, onboardedAt: true },
      where: eq(users.email, registrantEmail.trim().toLowerCase()),
    })

    const orgAdmin =
      existingUser ??
      (
        await auth.api.signUpEmail({
          body: {
            email: registrantEmail.trim().toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName?.trim() ?? undefined,
            locale: locale ?? DEFAULT_LOCALE,
            name: [firstName, lastName].filter(Boolean).join(' '),
            password: randomBytes(16).toString('hex'),
          },
        })
      )?.user

    if (!orgAdmin?.id) {
      throw new Error('Failed to create admin account')
    }

    const existingMembership = await db.query.memberships.findFirst({
      where: and(eq(memberships.organizationId, org.id), eq(memberships.userId, orgAdmin.id)),
    })

    if (!existingMembership) {
      await db.insert(memberships).values({
        organizationId: org.id,
        role: 'admin',
        userId: orgAdmin.id,
      })
    }

    if (!existingUser || !existingUser.onboardedAt) {
      await auth.api
        .requestPasswordReset({
          body: {
            email: registrantEmail.trim().toLowerCase(),
            redirectTo: `${process.env.APP_URL}/login`,
          },
        })
        .catch(() => null)
    }

    const inviterFullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'GloRe Admin'
    await sendMail({
      to: registrantEmail.trim().toLowerCase(),
      template: {
        name: 'organization/member-added',
        props: {
          organizationName: org.name,
          inviterName: inviterFullName,
          role: 'admin',
          isNewUser: !existingUser || !existingUser.onboardedAt,
          userName: firstName,
        },
      },
      locale: locale ?? undefined,
    }).catch(() => null)

    return { organizationId: org.id, organizationName: org.name }
  })
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
        with: { profile: true },
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
      ...parseOrganization({ ...record, joinRequests: [], memberships: membershipRecords }),
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

export const createAdminOrganizationAvatarUploadUrl = async (organizationId: number, contentType: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Forbidden' }
  if (!AVATAR_CONTENT_TYPES.includes(contentType)) return { error: 'Invalid image type' }

  const ext = contentType.split('/')[1]
  const key = `organizations/${organizationId}-${Date.now()}.${ext}`
  const url = await r2PresignPut(key, contentType)

  return { data: { key, url } }
}

export const confirmAdminOrganizationAvatar = async (organizationId: number, key: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Forbidden' }
  if (!key.startsWith(`organizations/${organizationId}-`)) return { error: 'Invalid key' }

  const result = await safeQuery(async () => {
    const current = await db.query.organizationProfiles.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizationProfiles.organizationId, organizationId),
    })

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: r2Url(key), organizationId })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { avatarUrl: r2Url(key) } })

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    return { avatarUrl: r2Url(key) }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

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

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    await db
      .insert(organizationProfiles)
      .values({ avatarUrl: null, organizationId })
      .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: { avatarUrl: null } })

    return { avatarUrl: null }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}

export const inviteAdminOrganizationMember = async (
  organizationId: number,
  {
    email,
    firstName,
    lastName,
    locale,
    role,
  }: {
    email: string
    firstName: string
    lastName: string
    locale: string
    role: OrganizationMembershipRole
  }
) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Forbidden' } }

  const result = await safeQuery(async () => {
    const org = await db.query.organizations.findFirst({
      columns: { id: true, name: true },
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    if (role === 'admin') {
      const adminCount = await getOrganizationAdminsCount(organizationId)
      if (adminCount > 0) {
        throw new Error('An organization admin already exists. Invite as representative instead.')
      }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedFirstName = firstName.trim()
    const normalizedLastName = lastName.trim()

    const existingUser = await db.query.users.findFirst({
      columns: { email: true, firstName: true, id: true, lastName: true, onboardedAt: true },
      where: eq(users.email, normalizedEmail),
    })

    const invitee =
      existingUser ??
      (
        await auth.api.signUpEmail({
          body: {
            email: normalizedEmail,
            firstName: normalizedFirstName,
            lastName: normalizedLastName || undefined,
            locale,
            name: [normalizedFirstName, normalizedLastName].filter(Boolean).join(' '),
            password: randomBytes(32).toString('hex'),
          },
        })
      )?.user

    if (!invitee?.id) {
      throw new Error('Failed to create member account')
    }

    const existingMembership = await db.query.memberships.findFirst({
      where: and(eq(memberships.organizationId, organizationId), eq(memberships.userId, invitee.id)),
    })

    if (existingMembership) {
      throw new Error('This user is already a member of the organization')
    }

    await db.insert(memberships).values({ organizationId, role, userId: invitee.id })

    const inviterName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email

    const emailSent = await sendOrganizationAccessEmail({
      email: normalizedEmail,
      inviterName,
      isNewUser: !existingUser || !existingUser.onboardedAt,
      organizationName: org.name,
      role,
    })

    if (!existingUser || !existingUser.onboardedAt) {
      await auth.api
        .requestPasswordReset({
          body: { email: normalizedEmail, redirectTo: `${process.env.APP_URL}/login` },
        })
        .catch(() => null)
    }

    return { email: normalizedEmail, emailSent, userId: invitee.id }
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

    await db.delete(memberships).where(eq(memberships.id, membership.id))

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

    await db.delete(organizations).where(eq(organizations.id, organizationId))

    return { organizationId }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}
