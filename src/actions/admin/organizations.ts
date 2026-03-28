'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag } from 'next/cache'

import { and, eq } from 'drizzle-orm'

import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseAdminOrganization } from '@/db/queries/organization'
import { memberships, organizationJoinRequests, organizationProfiles, organizations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { i18n } from '@/lib/i18n'

const fetchOrganizations = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations)

  return await safeQuery(async () => {
    const rows = await db.query.organizations.findMany({
      orderBy: (record, { desc: orderDesc }) => [orderDesc(record.createdAt)],
      with: {
        profile: true,
      },
      limit: 1000,
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
      limit: 1000,
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
      orderBy: (record, { desc: orderDesc }) => [orderDesc(record.createdAt)],
      with: {
        profile: true,
      },
      limit: 1000,
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
      limit: 1000,
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
