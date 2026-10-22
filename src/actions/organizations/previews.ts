import 'server-only'

import { and, eq, gt } from 'drizzle-orm'

import { db } from '@/db/client'
import { hashProof, normalizeEmail, proofIdentifier } from '@/db/mutations/invitation'
import { invitationState, inviteLinkState } from '@/db/queries/organization'
import { organizationInvitations, organizationInviteLinks, users, verifications } from '@/db/schema'
import { fullName } from '@/lib/utils'

const isProofValid = async (invitationId: number, proof: string | undefined) => {
  if (!proof) return false
  const match = await db.query.verifications.findFirst({
    columns: { id: true },
    where: and(
      eq(verifications.identifier, proofIdentifier(invitationId)),
      eq(verifications.value, hashProof(proof)),
      gt(verifications.expiresAt, new Date().toISOString())
    ),
  })
  return Boolean(match)
}

export const getInvitationPreview = async (token: string, proof?: string) => {
  const invitation = await db.query.organizationInvitations.findFirst({
    where: eq(organizationInvitations.token, token),
    with: {
      invitedBy: { columns: { email: true, firstName: true, lastName: true } },
      organization: { columns: { id: true, name: true }, with: { profile: { columns: { avatarUrl: true } } } },
    },
  })
  if (!invitation) return null

  const account =
    invitation.userId ??
    (
      await db.query.users.findFirst({
        columns: { id: true },
        where: eq(users.email, normalizeEmail(invitation.email)),
      })
    )?.id

  return {
    accountExists: Boolean(account),
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    inviterName: invitation.invitedBy ? fullName(invitation.invitedBy) || null : null,
    message: invitation.message,
    organization: {
      avatarUrl: invitation.organization.profile?.avatarUrl ?? null,
      id: invitation.organization.id,
      name: invitation.organization.name,
    },
    proofValid: account ? false : await isProofValid(invitation.id, proof),
    role: invitation.role,
    state: invitationState(invitation),
    userId: invitation.userId,
  }
}

export const getInviteLinkPreview = async (token: string) => {
  const link = await db.query.organizationInviteLinks.findFirst({
    where: eq(organizationInviteLinks.token, token),
    with: {
      organization: {
        columns: { approvedAt: true, id: true, name: true },
        with: { profile: { columns: { avatarUrl: true } } },
      },
    },
  })
  if (!link?.organization.approvedAt) return null

  return {
    organization: {
      avatarUrl: link.organization.profile?.avatarUrl ?? null,
      id: link.organization.id,
      name: link.organization.name,
    },
    requiresApproval: link.requiresApproval,
    role: link.role,
    state: inviteLinkState(link),
  }
}
