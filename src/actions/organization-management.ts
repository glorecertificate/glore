'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { and, count, eq } from 'drizzle-orm'

import { deleteCookie, setCookie } from '@/actions/cookies'
import { createNotification, createNotificationByEmail } from '@/actions/notification'
import {
  assertOrganizationAdmin,
  assertOrganizationManager,
  canInviteRole,
  canManageMemberRole,
  canReviewRequestRole,
  getDescriptionRecord,
  getFreshCurrentUser,
  getOrganizationAdminsCount,
  getOrganizationContext,
  memberUserColumns,
  reviewerColumns,
  sendJoinRequestDecisionEmail,
  sendOrganizationAccessEmail,
} from '@/actions/organization-helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  type OrganizationMembershipRole,
  parseOrganizationJoinRequest,
  parseOrganizationMember,
} from '@/db/queries/organization'
import { certificates, memberships, organizationJoinRequests, organizations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { i18n } from '@/lib/i18n'
import { r2Delete, r2Put } from '@/lib/storage'

export const inviteOrganizationMember = async ({
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
}) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationManager(managerRole)

    if (!canInviteRole(managerRole, role)) {
      throw new Error('You cannot invite users with this role')
    }

    if (role === 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)
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
      where: and(eq(memberships.organizationId, organization.id), eq(memberships.userId, invitee.id)),
    })

    if (existingMembership) {
      throw new Error('This user is already a member of the organization')
    }

    await db.insert(memberships).values({
      organizationId: organization.id,
      role,
      userId: invitee.id,
    })

    const inviterName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

    const emailSent = await sendOrganizationAccessEmail({
      email: normalizedEmail,
      inviterName,
      isNewUser: !existingUser || !existingUser.onboardedAt,
      organizationName: organization.name,
      role,
    })

    await createNotification(invitee.id, 'member_added', {
      organizationName: organization.name,
      role,
    }).catch(() => null)

    if (!existingUser || !existingUser.onboardedAt) {
      await auth.api
        .requestPasswordReset({
          body: {
            email: normalizedEmail,
            redirectTo: `${process.env.APP_URL}/login`,
          },
        })
        .catch(() => null)
    }

    return { email: normalizedEmail, emailSent, userId: invitee.id }
  })
}

export const updateOrganizationMemberRole = async (membershipId: number, role: OrganizationMembershipRole) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(managerRole)

    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organization.id)),
      with: {
        user: { columns: memberUserColumns },
      },
    })

    if (!membership) {
      throw new Error('Member not found')
    }

    if (membership.userId === user.id) {
      throw new Error('You cannot change your own role')
    }

    if (membership.role === 'admin' && role !== 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)

      if (adminCount <= 1) {
        throw new Error('At least one organization admin is required')
      }
    }

    if (role === 'admin' && membership.role !== 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)

      if (adminCount > 0) {
        throw new Error('An organization admin already exists. Only one admin is allowed per organization.')
      }
    }

    await db.update(memberships).set({ role }).where(eq(memberships.id, membership.id))

    return parseOrganizationMember({ ...membership, role })
  })
}

export const removeOrganizationMember = async (membershipId: number) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationManager(managerRole)

    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.id, membershipId), eq(memberships.organizationId, organization.id)),
      with: {
        user: { columns: memberUserColumns },
      },
    })

    if (!membership) {
      throw new Error('Member not found')
    }

    if (membership.userId === user.id) {
      throw new Error('You cannot remove yourself from the organization')
    }

    if (!canManageMemberRole(managerRole, membership.role)) {
      throw new Error('You cannot remove this member')
    }

    if (membership.role === 'admin') {
      const adminCount = await getOrganizationAdminsCount(organization.id)

      if (adminCount <= 1) {
        throw new Error('At least one organization admin is required')
      }
    }

    await db.delete(memberships).where(eq(memberships.id, membership.id))

    return { id: membership.id, userId: membership.userId }
  })
}

export const approveOrganizationJoinRequest = async (requestId: number) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationManager(managerRole)

    const request = await db.query.organizationJoinRequests.findFirst({
      where: and(
        eq(organizationJoinRequests.id, requestId),
        eq(organizationJoinRequests.organizationId, organization.id),
        eq(organizationJoinRequests.status, 'pending')
      ),
      with: {
        reviewer: { columns: reviewerColumns },
      },
    })

    if (!request) {
      throw new Error('Join request not found')
    }

    if (!canReviewRequestRole(managerRole, request.role)) {
      throw new Error('You cannot approve this request')
    }

    const existingUser = await db.query.users.findFirst({
      columns: { email: true, id: true, onboardedAt: true },
      where: eq(users.email, request.email),
    })

    const invitedUser =
      existingUser ??
      (
        await auth.api.signUpEmail({
          body: {
            email: request.email,
            firstName: request.firstName,
            lastName: request.lastName ?? undefined,
            locale: request.locale ?? i18n.defaultLocale,
            name: [request.firstName, request.lastName].filter(Boolean).join(' '),
            password: randomBytes(32).toString('hex'),
          },
        })
      )?.user

    if (!invitedUser?.id) {
      throw new Error('Failed to create member account')
    }

    const existingMembership = await db.query.memberships.findFirst({
      where: and(eq(memberships.organizationId, organization.id), eq(memberships.userId, invitedUser.id)),
    })

    if (!existingMembership) {
      await db.insert(memberships).values({
        organizationId: organization.id,
        role: request.role,
        userId: invitedUser.id,
      })
    }

    await db
      .update(organizationJoinRequests)
      .set({
        acceptedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
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

    await sendJoinRequestDecisionEmail({
      email: request.email,
      organizationName: organization.name,
      status: 'accepted',
    })

    await createNotification(invitedUser.id, 'join_request_decided', {
      organizationName: organization.name,
      status: 'accepted',
    }).catch(() => null)

    return parseOrganizationJoinRequest({ ...request, status: 'accepted' })
  })
}

export const rejectOrganizationJoinRequest = async (requestId: number, reviewerComment?: string) => {
  const { organization, role: managerRole, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationManager(managerRole)

    const request = await db.query.organizationJoinRequests.findFirst({
      where: and(
        eq(organizationJoinRequests.id, requestId),
        eq(organizationJoinRequests.organizationId, organization.id),
        eq(organizationJoinRequests.status, 'pending')
      ),
      with: {
        reviewer: { columns: reviewerColumns },
      },
    })

    if (!request) {
      throw new Error('Join request not found')
    }

    if (!canReviewRequestRole(managerRole, request.role)) {
      throw new Error('You cannot reject this request')
    }

    const nextComment = reviewerComment?.trim() || null

    await db
      .update(organizationJoinRequests)
      .set({
        rejectedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
        reviewerComment: nextComment,
        status: 'rejected',
      })
      .where(eq(organizationJoinRequests.id, request.id))

    await sendJoinRequestDecisionEmail({
      email: request.email,
      organizationName: organization.name,
      reviewerComment: nextComment,
      status: 'rejected',
    })

    await createNotificationByEmail(request.email, 'join_request_decided', {
      comment: nextComment,
      organizationName: organization.name,
      status: 'rejected',
    }).catch(() => null)

    return parseOrganizationJoinRequest({ ...request, reviewerComment: nextComment, status: 'rejected' })
  })
}

export const updateOrganization = async ({
  address,
  city,
  country,
  description,
  email,
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
}) => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    const current = await db.query.organizations.findFirst({
      where: eq(organizations.id, organization.id),
    })

    if (!current) {
      throw new Error('Organization not found')
    }

    await db
      .update(organizations)
      .set({
        address: address.trim() || null,
        city: city.trim(),
        country: country.trim() || null,
        description: getDescriptionRecord(description.trim(), user.locale ?? undefined, current.description ?? null),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: phone.trim() || null,
        postcode: postcode.trim() || null,
        region: region.trim() || null,
        url: url.trim() || null,
      })
      .where(eq(organizations.id, organization.id))

    const nextUser = await getFreshCurrentUser(user.id)

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const uploadOrganizationAvatar = async (formData: FormData) => {
  const file = formData.get('file') as File
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!file) {
      throw new Error('No file uploaded')
    }

    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    const current = await db.query.organizations.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizations.id, organization.id),
    })

    const url = await r2Put(`organizations/${organization.id}-${Date.now()}.png`, file, 'image/png')

    await db.update(organizations).set({ avatarUrl: url }).where(eq(organizations.id, organization.id))

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    const nextUser = await getFreshCurrentUser(user.id)

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const removeOrganizationAvatar = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    assertOrganizationAdmin(role)

    const current = await db.query.organizations.findFirst({
      columns: { avatarUrl: true },
      where: eq(organizations.id, organization.id),
    })

    if (current?.avatarUrl) {
      await r2Delete(current.avatarUrl).catch(() => null)
    }

    await db.update(organizations).set({ avatarUrl: null }).where(eq(organizations.id, organization.id))

    const nextUser = await getFreshCurrentUser(user.id)

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}

export const requestOrganizationRegistration = async ({
  city,
  country,
  email: orgEmail,
  firstName,
  lastName,
  locale,
  message,
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
  message?: string
  name: string
  registrantEmail: string
  url?: string
}) =>
  await safeQuery(async () => {
    const handle = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const existing = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.handle, handle),
    })

    const finalHandle = existing ? `${handle}-${randomBytes(3).toString('hex')}` : handle

    const [org] = await db
      .insert(organizations)
      .values({
        city: city.trim(),
        country: country.trim(),
        email: orgEmail.trim().toLowerCase(),
        handle: finalHandle,
        name: name.trim(),
        url: url?.trim() || null,
      })
      .returning({ id: organizations.id, name: organizations.name })

    if (!org) {
      throw new Error('Failed to create organization')
    }

    await db.insert(organizationJoinRequests).values({
      email: registrantEmail.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      locale: locale ?? i18n.defaultLocale,
      message: message?.trim() || null,
      organizationId: org.id,
      role: 'admin',
    })

    return { organizationId: org.id, organizationName: org.name }
  })

export const deleteOrganization = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    assertOrganizationAdmin(role)

    const [certificateCount] = await db
      .select({ total: count() })
      .from(certificates)
      .where(eq(certificates.organizationId, organization.id))

    if ((certificateCount?.total ?? 0) > 0) {
      throw new Error('Organizations with certificates cannot be deleted')
    }

    await db.delete(organizations).where(eq(organizations.id, organization.id))

    const nextUser = await getFreshCurrentUser(user.id)
    const nextOrganization = nextUser.organizations[0]

    if (nextOrganization?.id) {
      await setCookie('org', nextOrganization.id)
    } else {
      await deleteCookie('org')
    }

    return {
      organizationId: organization.id,
      user: nextUser,
    }
  })
}
