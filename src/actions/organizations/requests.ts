'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { revalidateTag } from 'next/cache'

import { and, eq } from 'drizzle-orm'

import { expireOrganizations } from '@/actions/admin/expire'
import { notify } from '@/actions/notifications/notify'
import {
  assertOrganizationManager,
  canReviewRequestRole,
  expireUserAccess,
  getOrganizationContext,
} from '@/actions/organizations/helpers'
import { guarded } from '@/actions/organizations/invite-core'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { approveJoinRequest, invitationError, rejectJoinRequest } from '@/db/mutations/invitation'
import { submitOrganizationApplication } from '@/db/mutations/organization'
import { type ApplicationInput, applicationHandle, applicationSchema } from '@/db/queries/organization-application'
import { organizationJoinRequests, organizations } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'
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

export const requestOrganizationRegistration = async (input: ApplicationInput) => {
  const parsed = applicationSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid application values' } }
  const application = parsed.data

  const address = await clientAddress()
  const [byAddress, byEmail] = await Promise.all([
    isRateLimited(`register:ip:${address}`, 5, REGISTRATION_RATE_LIMIT_WINDOW),
    isRateLimited(`register:email:${application.registrantEmail}`, 3, REGISTRATION_RATE_LIMIT_WINDOW),
  ])
  if (byAddress || byEmail) return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }

  const result = await safeQuery(async () => {
    const handle = applicationHandle(application.name)
    const existing = await db.query.organizations.findFirst({
      columns: { id: true },
      where: eq(organizations.handle, handle),
    })

    const { event, organization } = await transaction(tx =>
      submitOrganizationApplication(tx, {
        application: { ...application, locale: application.locale ?? DEFAULT_LOCALE },
        handle: existing ? `${handle}-${randomBytes(3).toString('hex')}` : handle,
      })
    )
    await notify(event)

    return { organizationId: organization.id, organizationName: organization.name }
  })

  if (!result.error) expireOrganizations()

  return result
}
