'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag } from 'next/cache'

import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseAdminOrganization } from '@/db/queries/organization'
import { parseUser, userWith } from '@/db/queries/user'
import { memberships, organizationJoinRequests, organizations, teamInvitations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { JOIN_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { i18n } from '@/lib/i18n'

const INVITATION_EXPIRY_DAYS = 7

const fetchTeamMembers = async () => {
  'use cache'
  cacheTag(CacheTag.TeamMembers)

  return await safeQuery(async () => {
    const result = await db.query.users.findMany({
      where: or(eq(users.role, 'admin'), eq(users.isEditor, true)),
      with: userWith,
    })
    return result.map(parseUser)
  })
}

export const getTeamMembers = async ({ cache = true }: { cache?: boolean } = {}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  if (!cache) {
    const result = await db.query.users.findMany({
      where: or(eq(users.role, 'admin'), eq(users.isEditor, true)),
      with: userWith,
    })
    return { data: result.map(parseUser), error: null }
  }
  return await fetchTeamMembers()
}

export const inviteTeamMember = async ({
  email,
  firstName,
  lastName,
  locale,
  role,
}: {
  email: string
  firstName: string
  lastName: string
  locale: Locale
  role: 'admin' | 'editor'
}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can invite team members' }

  const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password: randomBytes(32).toString('hex'),
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      locale,
    },
  })
  if (!result?.user) return { error: 'Failed to create user' }

  await db
    .update(users)
    .set({
      role: role === 'admin' ? 'admin' : 'user',
      isEditor: role === 'editor',
    })
    .where(eq(users.id, result.user.id))

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(teamInvitations).values({
    userId: result.user.id,
    token,
    email,
    firstName: firstName.trim(),
    lastName: lastName.trim() || null,
    role,
    locale,
    invitedBy: currentUser.id,
    expiresAt,
  })

  const displayName = [firstName, lastName].filter(Boolean).join(' ')
  const joinUrl = `${process.env.APP_URL}${JOIN_ROOT}?token=${token}`

  try {
    await sendMail({
      to: email,
      template: {
        name: 'team/invite',
        props: { url: joinUrl, inviteeName: displayName, role: role as 'admin' | 'editor', userName: displayName },
      },
      locale: locale ?? undefined,
    })
  } catch (error) {
    console.error('Failed to send team invite email:', error)
    return { error: error instanceof Error ? error.message : 'Failed to send invitation email' }
  }

  return { data: { id: result.user.id, email, role } }
}

export const resendInvitation = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can resend invitations' }

  const existing = await db.query.teamInvitations.findFirst({
    columns: { id: true, email: true, firstName: true, lastName: true, role: true, locale: true },
    where: and(eq(teamInvitations.userId, userId), isNull(teamInvitations.acceptedAt)),
    orderBy: desc(teamInvitations.createdAt),
  })
  if (!existing) return { error: 'No pending invitation found for this user' }

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await db
    .update(teamInvitations)
    .set({ token, expiresAt, updatedAt: new Date().toISOString() })
    .where(eq(teamInvitations.id, existing.id))

  const displayName = [existing.firstName, existing.lastName].filter(Boolean).join(' ')
  const joinUrl = `${process.env.APP_URL}/api/v1/join?token=${token}`

  try {
    await sendMail({
      to: existing.email,
      template: {
        name: 'team/invite',
        props: {
          url: joinUrl,
          inviteeName: displayName,
          role: existing.role as 'admin' | 'editor',
          userName: displayName,
        },
      },
      locale: existing.locale ?? undefined,
    })
  } catch (error) {
    console.error('Failed to resend team invite email:', error)
    return { error: error instanceof Error ? error.message : 'Failed to resend invitation email' }
  }

  return { data: { email: existing.email } }
}

export const updateTeamMemberRole = async (userId: string, role: 'admin' | 'editor') => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can update team member roles' }
  if (currentUser.id === userId) return { error: 'You cannot change your own role' }

  await db
    .update(users)
    .set({
      role: role === 'admin' ? 'admin' : 'user',
      isEditor: role === 'editor',
    })
    .where(eq(users.id, userId))

  return { data: { id: userId, role } }
}

export const deleteTeamMember = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'You must be an admin to remove team members' }
  if (currentUser.id === userId) return { error: 'You cannot remove yourself from the team' }

  await db.delete(users).where(eq(users.id, userId))

  return { data: { id: userId } }
}

const fetchOrganizations = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations)

  return await safeQuery(async () => {
    const rows = await db.query.organizations.findMany({
      orderBy: (record, { desc }) => [desc(record.createdAt)],
    })

    const requests = await db.query.organizationJoinRequests.findMany({
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
    })

    const requestMap = new Map(requests.map(r => [r.organizationId, r]))

    return rows.map(org =>
      parseAdminOrganization({
        ...org,
        registrationRequest: requestMap.get(org.id) ?? null,
      })
    )
  })
}

export const getOrganizations = async ({ cache = true }: { cache?: boolean } = {}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  if (!cache) {
    const rows = await db.query.organizations.findMany({
      orderBy: (record, { desc }) => [desc(record.createdAt)],
    })

    const requests = await db.query.organizationJoinRequests.findMany({
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
    })

    const requestMap = new Map(requests.map(r => [r.organizationId, r]))

    return {
      data: rows.map(org =>
        parseAdminOrganization({
          ...org,
          registrationRequest: requestMap.get(org.id) ?? null,
        })
      ),
      error: null,
    }
  }

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
            locale: request.locale ?? i18n.defaultLocale,
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
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

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
            locale: locale ?? i18n.defaultLocale,
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

const fetchAdminUsers = async () => {
  'use cache'
  cacheTag(CacheTag.AdminUsers)

  return await safeQuery(async () => {
    const result = await db.query.users.findMany({
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      with: userWith,
    })
    return result.map(parseUser)
  })
}

export const getAdminUsers = async ({ cache = true }: { cache?: boolean } = {}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  if (!cache) {
    const result = await db.query.users.findMany({
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      with: userWith,
    })
    return { data: result.map(parseUser), error: null }
  }
  return await fetchAdminUsers()
}

export const banUser = async (userId: string, reason?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can ban users' }
  if (currentUser.id === userId) return { error: 'You cannot ban yourself' }

  await db
    .update(users)
    .set({ banned: true, banReason: reason?.trim() || null })
    .where(eq(users.id, userId))

  return { data: { id: userId } }
}

export const unbanUser = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can unban users' }

  await db.update(users).set({ banned: false, banReason: null, banExpires: null }).where(eq(users.id, userId))

  return { data: { id: userId } }
}

export const updateUserRole = async (userId: string, role: 'admin' | 'editor' | 'user') => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can update user roles' }
  if (currentUser.id === userId) return { error: 'You cannot change your own role' }

  await db
    .update(users)
    .set({
      role: role === 'admin' ? 'admin' : 'user',
      isEditor: role === 'editor',
    })
    .where(eq(users.id, userId))

  return { data: { id: userId, role } }
}
