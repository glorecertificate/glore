import 'server-only'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { notify } from '@/actions/notifications/notify'
import { db, transaction } from '@/db/client'
import { mapSequential, queryError } from '@/db/helpers'
import {
  assertLinkActive,
  assertPending,
  createInvitation,
  invitationError,
  invitationUrl,
  inviteLinkUrl,
  isInvitationError,
  normalizeEmail,
  revealInvitationToken,
  revealInviteLinkToken,
} from '@/db/mutations/invitation'
import { isMemberError } from '@/db/mutations/organization'
import {
  type InvitationErrorCode,
  type OrganizationMembershipRole,
  canManageInvitation,
} from '@/db/queries/organization'
import { organizationInvitations, organizationInviteLinks } from '@/db/schema'
import { LOCALES } from '@/lib/i18n'
import config from '~/config/app.json'

const INVITABLE_ROLES = ['admin', 'learner', 'representative', 'tutor', 'volunteer'] as const

export const inviteSchema = z.object({
  emails: z.array(z.string().max(254)).min(1),
  locale: z.enum(LOCALES),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform(value => value || null),
  role: z.enum(INVITABLE_ROLES),
})

export type InviteInput = z.input<typeof inviteSchema>

export type InvitationRowStatus = 'already_invited' | 'already_member' | 'failed' | 'invalid' | 'role_taken' | 'sent'

export interface InvitationRowResult {
  email: string
  status: InvitationRowStatus
}

const actionError = (error: unknown) => {
  if (isInvitationError(error) || isMemberError(error)) return { code: error.code, message: error.message }
  return queryError(error)
}

export const failure = (code: InvitationErrorCode) => ({
  data: null,
  error: actionError(invitationError(code)),
})

export const guarded = async <T>(run: () => Promise<T>) => {
  try {
    return { data: await run(), error: null }
  } catch (error) {
    return { data: null, error: actionError(error) }
  }
}

const ROW_STATUS = {
  ALREADY_INVITED: 'already_invited',
  ALREADY_MEMBER: 'already_member',
  ROLE_TAKEN: 'role_taken',
} as const

const emailSchema = z.email().max(254)

export const dedupeEmails = (emails: string[]) => [
  ...new Set(
    emails.flatMap(value => {
      const email = normalizeEmail(value)
      return email ? [email] : []
    })
  ),
]

export const sendInvitations = async ({
  actorId,
  emails,
  locale,
  message,
  organizationId,
  role,
}: {
  actorId: string
  emails: string[]
  locale: string
  message: string | null
  organizationId: number
  role: OrganizationMembershipRole
}): Promise<InvitationRowResult[]> =>
  await mapSequential(dedupeEmails(emails), async (email): Promise<InvitationRowResult> => {
    if (!emailSchema.safeParse(email).success) return { email, status: 'invalid' }

    try {
      const { event } = await transaction(tx =>
        createInvitation(tx, {
          email,
          expiryDays: config.invitationExpiryDays,
          invitedById: actorId,
          locale,
          message,
          organizationId,
          role,
        })
      )
      await notify(event)
      return { email, status: 'sent' }
    } catch (error) {
      const code = isInvitationError(error) ? error.code : null
      const status = code && code in ROW_STATUS ? ROW_STATUS[code as keyof typeof ROW_STATUS] : 'failed'
      if (status === 'failed') console.error('Failed to invite a member', error)
      return { email, status }
    }
  })

export const readInvitationUrl = async ({
  invitationId,
  managerRole,
  organizationId,
  userId,
}: {
  invitationId: number
  managerRole: OrganizationMembershipRole
  organizationId: number
  userId: string
}) => {
  const invitation = await db.query.organizationInvitations.findFirst({
    where: and(
      eq(organizationInvitations.id, invitationId),
      eq(organizationInvitations.organizationId, organizationId)
    ),
  })
  if (!invitation) throw invitationError('NOT_FOUND')
  if (!canManageInvitation(managerRole, invitation, userId)) throw invitationError('FORBIDDEN')
  assertPending(invitation)
  return invitationUrl(await transaction(tx => revealInvitationToken(tx, invitation)))
}

export const readInviteLinkUrl = async ({
  inviteLinkId,
  organizationId,
}: {
  inviteLinkId: number
  organizationId: number
}) => {
  const link = await db.query.organizationInviteLinks.findFirst({
    where: and(
      eq(organizationInviteLinks.id, inviteLinkId),
      eq(organizationInviteLinks.organizationId, organizationId)
    ),
  })
  if (!link) throw invitationError('NOT_FOUND')
  assertLinkActive(link)
  return inviteLinkUrl(await transaction(tx => revealInviteLinkToken(tx, link)))
}
