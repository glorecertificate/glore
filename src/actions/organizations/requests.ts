'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { revalidateTag } from 'next/cache'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  assertOrganizationManager,
  canReviewRequestRole,
  createInvitationUrl,
  expireUserAccess,
  getOrganizationContext,
  reviewerColumns,
  sendJoinRequestDecisionEmail,
  sendRegistrationRequestEmails,
} from '@/actions/organizations/helpers'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { createOrganization } from '@/db/mutations/organization'
import { parseOrganizationJoinRequest } from '@/db/queries/organization'
import { memberships, organizationJoinRequests, organizations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'

const REGISTRATION_RATE_LIMIT_WINDOW = 60 * 60 * 1000

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
            locale: request.locale ?? DEFAULT_LOCALE,
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
    expireUserAccess([invitedUser.id])

    await db
      .update(organizationJoinRequests)
      .set({
        acceptedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
        status: 'accepted',
      })
      .where(eq(organizationJoinRequests.id, request.id))

    const invitationUrl = existingUser?.onboardedAt
      ? undefined
      : await createInvitationUrl({
          email: request.email,
          firstName: request.firstName,
          invitedBy: user.id,
          lastName: request.lastName,
          locale: request.locale,
          role: request.role,
          userId: invitedUser.id,
        })

    await sendJoinRequestDecisionEmail({
      email: request.email,
      organizationName: organization.name,
      status: 'accepted',
      url: invitationUrl,
    })

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

    await Promise.all([
      db
        .update(organizationJoinRequests)
        .set({
          rejectedAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: user.id,
          reviewerComment: nextComment,
          status: 'rejected',
        })
        .where(eq(organizationJoinRequests.id, request.id)),
      sendJoinRequestDecisionEmail({
        email: request.email,
        organizationName: organization.name,
        reviewerComment: nextComment,
        status: 'rejected',
      }),
    ])

    return parseOrganizationJoinRequest({ ...request, reviewerComment: nextComment, status: 'rejected' })
  })
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform(value => value || null)

const registrationSchema = z.object({
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(2).max(2),
  email: z.email().max(254).toLowerCase(),
  firstName: z.string().trim().min(1).max(100),
  lastName: optionalText(100),
  locale: z.enum(LOCALES).optional(),
  message: optionalText(2000),
  name: z.string().trim().min(2).max(150),
  registrantEmail: z.email().max(254).toLowerCase(),
  url: optionalText(500),
})

const toHandle = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 60) || 'organization'

export const requestOrganizationRegistration = async (input: z.input<typeof registrationSchema>) => {
  const parsed = registrationSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid registration values' } }
  const { city, country, email, firstName, lastName, locale, message, name, registrantEmail, url } = parsed.data

  const address = await clientAddress()
  const [byAddress, byEmail] = await Promise.all([
    isRateLimited(`register:ip:${address}`, 5, REGISTRATION_RATE_LIMIT_WINDOW),
    isRateLimited(`register:email:${registrantEmail}`, 3, REGISTRATION_RATE_LIMIT_WINDOW),
  ])
  if (byAddress || byEmail) return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }

  const result = await safeQuery(async () => {
    const handle = toHandle(name)
    const existing = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.handle, handle),
    })

    const org = await transaction(async tx => {
      const created = await createOrganization(tx, {
        city,
        country,
        email,
        handle: existing ? `${handle}-${randomBytes(3).toString('hex')}` : handle,
        name,
        url,
      })
      await tx.insert(organizationJoinRequests).values({
        email: registrantEmail,
        firstName,
        lastName,
        locale: locale ?? DEFAULT_LOCALE,
        message,
        organizationId: created.id,
        role: 'admin',
      })
      return created
    })

    await Promise.all([
      sendMail({
        locale,
        template: {
          name: 'organization/join-request',
          props: { organizationName: org.name, status: 'pending', userName: firstName },
        },
        to: registrantEmail,
      }).catch(() => null),
      sendRegistrationRequestEmails({
        city,
        country,
        message,
        organizationId: org.id,
        organizationName: org.name,
        registrantEmail,
        registrantName: [firstName, lastName].filter(Boolean).join(' '),
      }),
    ])

    return { organizationId: org.id, organizationName: org.name }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}
