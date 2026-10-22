import 'server-only'

import { and, eq, isNull } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { createInvitation } from '@/db/mutations/invitation'
import { type AppEvent } from '@/db/queries/activity-event'
import {
  memberships,
  organizationInvitations,
  organizationInviteLinks,
  organizationJoinRequests,
  organizationProfiles,
  organizations,
  teamInvitations,
  users,
} from '@/db/schema'
import { type IntlRecord } from '@/lib/i18n'
import { fullName } from '@/lib/utils'

export const createOrganization = async (
  tx: Transaction,
  {
    approvedAt,
    city,
    country,
    email,
    handle,
    name,
    url,
  }: {
    approvedAt?: string | null
    city: string
    country?: string | null
    email: string
    handle: string
    name: string
    url?: string | null
  }
) => {
  const [org] = await tx
    .insert(organizations)
    .values({ approvedAt: approvedAt ?? null, city, email, handle, name })
    .returning({ id: organizations.id, name: organizations.name })

  if (!org) {
    throw new Error('Failed to create organization')
  }

  await tx.insert(organizationProfiles).values({
    country: country ?? null,
    organizationId: org.id,
    url: url ?? null,
  })

  return org
}

export const updateOrganization = async (
  tx: Transaction,
  organizationId: number,
  {
    address,
    city,
    country,
    description,
    email,
    expectedUpdatedAt,
    name,
    phone,
    postcode,
    region,
    url,
  }: {
    address: string | null
    city: string
    country: string | null
    description: IntlRecord | null
    email: string
    name: string
    phone: string | null
    postcode: string | null
    region: string | null
    url: string | null
    expectedUpdatedAt?: string
  }
) => {
  const [updated] = await tx
    .update(organizations)
    .set({ city, email, name })
    .where(
      expectedUpdatedAt
        ? and(eq(organizations.id, organizationId), eq(organizations.updatedAt, expectedUpdatedAt))
        : eq(organizations.id, organizationId)
    )
    .returning({ id: organizations.id })
  if (!updated) throw new Error('Conflict: organization was modified by another request')

  await tx
    .insert(organizationProfiles)
    .values({ address, country, description, organizationId, phone, postcode, region, url })
    .onConflictDoUpdate({
      target: organizationProfiles.organizationId,
      set: { address, country, description, phone, postcode, region, url },
    })
}

export const removeMembership = async (
  tx: Transaction,
  { actorId, membershipId, organizationId }: { actorId: string; membershipId: number; organizationId: number }
) => {
  const [removed] = await tx
    .delete(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)))
    .returning({ role: memberships.role, userId: memberships.userId })
  if (!removed) throw new Error('Member not found')

  const nowIso = new Date().toISOString()
  const links = await tx
    .update(organizationInviteLinks)
    .set({ revokedAt: nowIso })
    .where(
      and(
        eq(organizationInviteLinks.organizationId, organizationId),
        eq(organizationInviteLinks.createdById, removed.userId),
        isNull(organizationInviteLinks.revokedAt)
      )
    )
    .returning({ id: organizationInviteLinks.id })
  const invitations = await tx
    .update(organizationInvitations)
    .set({ revokedAt: nowIso })
    .where(
      and(
        eq(organizationInvitations.organizationId, organizationId),
        eq(organizationInvitations.invitedById, removed.userId),
        isNull(organizationInvitations.acceptedAt),
        isNull(organizationInvitations.declinedAt),
        isNull(organizationInvitations.revokedAt)
      )
    )
    .returning({ id: organizationInvitations.id, userId: organizationInvitations.userId })

  const [remaining] = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, removed.userId))
    .limit(1)
  const account = await tx.query.users.findFirst({
    columns: { isEditor: true, role: true },
    where: eq(users.id, removed.userId),
  })
  if (!remaining && account && !account.isEditor && account.role !== 'admin') {
    await tx
      .delete(teamInvitations)
      .where(and(eq(teamInvitations.userId, removed.userId), isNull(teamInvitations.acceptedAt)))
  }

  const events: AppEvent[] = [
    ...invitations.map(
      ({ id, userId }) =>
        ({
          type: 'invitation.revoked',
          actorId,
          organizationId,
          data: { invitationId: id, userId },
        }) satisfies AppEvent<'invitation.revoked'>
    ),
    ...links.map(
      ({ id }) =>
        ({
          type: 'invite_link.revoked',
          actorId,
          organizationId,
          data: { inviteLinkId: id },
        }) satisfies AppEvent<'invite_link.revoked'>
    ),
    {
      type: 'member.removed',
      actorId,
      organizationId,
      data: { userId: removed.userId },
    } satisfies AppEvent<'member.removed'>,
  ]
  await mapSequential(events, event => recordEvent(tx, event))

  return { events, removed }
}

export const approveOrganizationApplication = async (
  tx: Transaction,
  {
    comment,
    expiryDays,
    organizationId,
    reviewerId,
  }: { comment: string | null; expiryDays: number; organizationId: number; reviewerId: string }
) => {
  const organization = await tx.query.organizations.findFirst({ where: eq(organizations.id, organizationId) })
  if (!organization) throw new Error('Organization not found')
  if (organization.approvedAt) throw new Error('Organization is already approved')

  const request = await tx.query.organizationJoinRequests.findFirst({
    where: and(
      eq(organizationJoinRequests.organizationId, organizationId),
      eq(organizationJoinRequests.role, 'admin'),
      eq(organizationJoinRequests.status, 'pending')
    ),
  })
  if (!request) throw new Error('Registration request not found')

  const nowIso = new Date().toISOString()
  await tx.update(organizations).set({ approvedAt: nowIso }).where(eq(organizations.id, organizationId))
  await tx
    .update(organizationJoinRequests)
    .set({
      acceptedAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: reviewerId,
      reviewerComment: comment,
      status: 'accepted',
    })
    .where(eq(organizationJoinRequests.id, request.id))

  const { event: invitationEvent, invitation } = await createInvitation(tx, {
    email: request.email,
    expiryDays,
    invitedById: reviewerId,
    locale: request.locale,
    organizationId,
    refresh: true,
    role: 'admin',
  })

  const event = {
    type: 'organization.application_decided',
    actorId: reviewerId,
    organizationId,
    data: {
      applicantEmail: request.email,
      applicantName: fullName(request) || request.email,
      approved: true,
      comment,
      invitationUrl: invitationEvent.data.url,
      locale: request.locale,
      organizationName: organization.name,
    },
  } satisfies AppEvent<'organization.application_decided'>
  await recordEvent(tx, event)

  return { event, invitation }
}

export const createOrganizationWithAdminInvitation = async (
  tx: Transaction,
  {
    admin,
    organization,
  }: {
    admin: { email: string; expiryDays: number; invitedById: string; locale?: string | null }
    organization: Parameters<typeof createOrganization>[1]
  }
) => {
  const created = await createOrganization(tx, organization)
  const { event, invitation } = await createInvitation(tx, { ...admin, organizationId: created.id, role: 'admin' })

  return { event, invitation, organization: created }
}
