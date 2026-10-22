'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { revalidateTag } from 'next/cache'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { notify } from '@/actions/notifications/notify'
import {
  assertOrganizationManager,
  canReviewRequestRole,
  expireUserAccess,
  getOrganizationContext,
  sendRegistrationRequestEmails,
} from '@/actions/organizations/helpers'
import { guarded } from '@/actions/organizations/invite-core'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { approveJoinRequest, invitationError, rejectJoinRequest } from '@/db/mutations/invitation'
import { createOrganization } from '@/db/mutations/organization'
import { organizationJoinRequests, organizations } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'
import { fullName } from '@/lib/utils'
import config from '~/config/app.json'

const REGISTRATION_RATE_LIMIT_WINDOW = 60 * 60 * 1000

const requireReviewer = async (requestId: number) => {
  const { organization, role, user } = await getOrganizationContext()
  if (!(organization?.id && role)) throw invitationError('FORBIDDEN')
  assertOrganizationManager(role)

  const request = await db.query.organizationJoinRequests.findFirst({
    columns: { id: true, role: true },
    where: and(
      eq(organizationJoinRequests.id, requestId),
      eq(organizationJoinRequests.organizationId, organization.id)
    ),
  })
  if (!request) throw invitationError('NOT_FOUND')
  if (!canReviewRequestRole(role, request.role)) throw invitationError('FORBIDDEN')

  return { organizationId: organization.id, reviewerId: user.id }
}

export const approveOrganizationJoinRequest = async (requestId: number) =>
  await guarded(async () => {
    const { organizationId, reviewerId } = await requireReviewer(requestId)
    const result = await transaction(tx =>
      approveJoinRequest(tx, { expiryDays: config.invitationExpiryDays, organizationId, requestId, reviewerId })
    )

    if (result.kind === 'member') {
      await notify(result.joinedEvent)
      await notify(result.decidedEvent)
      expireUserAccess([result.joinedEvent.data.userId])
      revalidateTag(CacheTag.Organizations, 'max')
      return { kind: result.kind }
    }

    await notify(result.decidedEvent)
    return { kind: result.kind }
  })

export const rejectOrganizationJoinRequest = async (requestId: number, reviewerComment?: string) =>
  await guarded(async () => {
    const { organizationId, reviewerId } = await requireReviewer(requestId)
    const { event } = await transaction(tx =>
      rejectJoinRequest(tx, {
        comment: reviewerComment?.trim().slice(0, 500) || null,
        organizationId,
        requestId,
        reviewerId,
      })
    )
    await notify(event)
    return { kind: 'rejected' as const }
  })

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
        registrantName: fullName({ firstName, lastName }),
      }),
    ])

    return { organizationId: org.id, organizationName: org.name }
  })

  if (!result.error) revalidateTag(CacheTag.Organizations, 'max')

  return result
}
