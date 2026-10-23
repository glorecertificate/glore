'use server'

import 'server-only'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { notify } from '@/actions/notifications/notify'
import { assertOrganizationManager, getOrganizationAccess } from '@/actions/organizations/helpers'
import {
  type InviteInput,
  dedupeEmails,
  guarded,
  inviteSchema,
  readInvitationUrl,
  readInviteLinkUrl,
  sendInvitations,
} from '@/actions/organizations/invite-core'
import { db, transaction } from '@/db/client'
import {
  createInviteLink,
  invitationError,
  inviteLinkUrl,
  resendInvitation,
  revokeInvitation,
  revokeInviteLink,
} from '@/db/mutations/invitation'
import { canInviteRole, canManageInvitation } from '@/db/queries/organization'
import { organizationInvitations } from '@/db/schema'
import { isRateLimited } from '@/lib/rate-limit'
import config from '~/config/app.json'

const HOUR = 60 * 60 * 1000
const INVITE_BATCHES_PER_HOUR = 10

const requireManager = async (organizationId?: number) => {
  const { organizationId: id, role, user } = await getOrganizationAccess(organizationId)
  assertOrganizationManager(role)
  return { managerRole: role, organizationId: id, user }
}

const findManagedInvitation = async (invitationId: number, organizationId: number) => {
  const invitation = await db.query.organizationInvitations.findFirst({
    columns: { id: true, invitedById: true, role: true },
    where: and(
      eq(organizationInvitations.id, invitationId),
      eq(organizationInvitations.organizationId, organizationId)
    ),
  })
  if (!invitation) throw invitationError('NOT_FOUND')
  return invitation
}

export const inviteOrganizationMembers = async (input: InviteInput, scopeId?: number) =>
  await guarded(async () => {
    const { managerRole, organizationId, user } = await requireManager(scopeId)
    const parsed = inviteSchema.safeParse(input)
    if (!parsed.success) throw invitationError('INVALID')
    const { emails, locale, message, role } = parsed.data
    if (!canInviteRole(managerRole, role)) throw invitationError('FORBIDDEN')
    const unique = dedupeEmails(emails)
    if (unique.length > config.maxBulkInvites) throw invitationError('INVALID')
    if (await isRateLimited(`org-invite:${user.id}`, INVITE_BATCHES_PER_HOUR, HOUR)) {
      throw invitationError('RATE_LIMITED')
    }
    return await sendInvitations({ actorId: user.id, emails: unique, locale, message, organizationId, role })
  })

export const resendOrganizationInvitation = async (invitationId: number, scopeId?: number) =>
  await guarded(async () => {
    const { managerRole, organizationId, user } = await requireManager(scopeId)
    const invitation = await findManagedInvitation(invitationId, organizationId)
    if (!canManageInvitation(managerRole, invitation, user.id)) throw invitationError('FORBIDDEN')

    const { event } = await transaction(tx =>
      resendInvitation(tx, {
        actorId: user.id,
        expiryDays: config.invitationExpiryDays,
        invitationId,
        organizationId,
      })
    )
    await notify(event)
    return { id: invitationId }
  })

export const revokeOrganizationInvitation = async (invitationId: number, scopeId?: number) =>
  await guarded(async () => {
    const { managerRole, organizationId, user } = await requireManager(scopeId)
    const invitation = await findManagedInvitation(invitationId, organizationId)
    if (!canManageInvitation(managerRole, invitation, user.id)) throw invitationError('FORBIDDEN')

    const { event } = await transaction(tx => revokeInvitation(tx, { actorId: user.id, invitationId, organizationId }))
    await notify(event)
    return { id: invitationId }
  })

export const copyOrganizationInvitationLink = async (invitationId: number, scopeId?: number) =>
  await guarded(async () => {
    const { managerRole, organizationId, user } = await requireManager(scopeId)
    return { url: await readInvitationUrl({ invitationId, managerRole, organizationId, userId: user.id }) }
  })

export const copyOrganizationInviteLink = async (inviteLinkId: number) =>
  await guarded(async () => {
    const { organizationId } = await requireManager()
    return { url: await readInviteLinkUrl({ inviteLinkId, organizationId }) }
  })

const inviteLinkSchema = z.object({
  expiryDays: z.number().int().min(1).max(365).nullable(),
  maxUses: z.number().int().min(1).max(10_000).nullable(),
  requiresApproval: z.boolean(),
  role: z.enum(['learner', 'volunteer']),
})

export const createOrganizationInviteLink = async (input: z.input<typeof inviteLinkSchema>) =>
  await guarded(async () => {
    const { organizationId, user } = await requireManager()
    const parsed = inviteLinkSchema.safeParse(input)
    if (!parsed.success) throw invitationError('INVALID')

    const { event, link, token } = await transaction(tx =>
      createInviteLink(tx, { ...parsed.data, createdById: user.id, organizationId })
    )
    await notify(event)
    return { id: link.id, url: inviteLinkUrl(token) }
  })

export const revokeOrganizationInviteLink = async (inviteLinkId: number) =>
  await guarded(async () => {
    const { organizationId, user } = await requireManager()
    const { event } = await transaction(tx => revokeInviteLink(tx, { actorId: user.id, inviteLinkId, organizationId }))
    await notify(event)
    return { id: inviteLinkId }
  })
