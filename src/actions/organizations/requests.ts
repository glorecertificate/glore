'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { and, eq } from 'drizzle-orm'

import { createNotification, createNotificationByEmail } from '@/actions/notification'
import {
  assertOrganizationManager,
  canReviewRequestRole,
  getOrganizationContext,
  reviewerColumns,
  sendJoinRequestDecisionEmail,
} from '@/actions/organizations/helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseOrganizationJoinRequest } from '@/db/queries/organization'
import { memberships, organizationJoinRequests, organizationProfiles, organizations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { sendMail } from '@/lib/email'
import { i18n } from '@/lib/i18n'

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

    await db.insert(organizationJoinRequests).values({
      email: registrantEmail.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      locale: locale ?? i18n.defaultLocale,
      message: message?.trim() || null,
      organizationId: org.id,
      role: 'admin',
    })

    await sendMail({
      locale: locale ?? undefined,
      template: {
        name: 'organization/join-request',
        props: { organizationName: org.name, status: 'pending', userName: firstName.trim() },
      },
      to: registrantEmail.trim().toLowerCase(),
    }).catch(() => null)

    return { organizationId: org.id, organizationName: org.name }
  })
