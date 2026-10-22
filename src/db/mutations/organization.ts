import 'server-only'

import { and, eq, inArray, isNull } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { assignCertificate } from '@/db/mutations/certificate'
import { createInvitation } from '@/db/mutations/invitation'
import { type AppEvent } from '@/db/queries/activity-event'
import { OPEN_CERTIFICATE_STATUSES } from '@/db/queries/certificate'
import { type MemberErrorCode, type OrganizationMembershipRole, mergeDescription } from '@/db/queries/organization'
import { type ApplicationValues } from '@/db/queries/organization-application'
import {
  certificates,
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

const MEMBER_ERROR_MESSAGES = {
  CONFIRMATION: 'The confirmation does not match',
  FORBIDDEN: 'You do not have permission to do this',
  HAS_CERTIFICATES: 'Organizations with certificates cannot be deleted',
  INVALID: 'These values are not valid',
  LAST_OWNER: 'Transfer the ownership before leaving or removing the owner',
  NOT_ELIGIBLE: 'This member cannot become the owner',
  NOT_FOUND: 'Member not found',
  OWNER_ROLE: 'The owner role changes only through an ownership transfer',
  RATE_LIMITED: 'Too many attempts',
  SELF: 'You cannot do this to your own membership',
} satisfies Record<MemberErrorCode, string>

export const memberError = (code: MemberErrorCode) => Object.assign(new Error(MEMBER_ERROR_MESSAGES[code]), { code })

export const isMemberError = (error: unknown): error is Error & { code: MemberErrorCode } =>
  error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code in MEMBER_ERROR_MESSAGES

const releaseTutorAssignments = async (
  tx: Transaction,
  { actorId, organizationId, tutorId }: { actorId: string; organizationId: number; tutorId: string }
) => {
  const open = await tx
    .select({
      id: certificates.id,
      reviewerId: certificates.reviewerId,
      status: certificates.status,
      userId: certificates.userId,
    })
    .from(certificates)
    .where(
      and(
        eq(certificates.organizationId, organizationId),
        eq(certificates.reviewerId, tutorId),
        inArray(certificates.status, [...OPEN_CERTIFICATE_STATUSES])
      )
    )
  const events: AppEvent<'certificate.unassigned'>[] = []
  for (const row of open) {
    await assignCertificate(tx, { expected: row, id: row.id, reviewerId: null })
    events.push({
      type: 'certificate.unassigned',
      actorId,
      organizationId,
      data: { certificateId: row.id, holderId: row.userId, previousTutorId: tutorId },
    })
  }
  return events
}

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
    descriptionPatch,
    email,
    expectedUpdatedAt,
    legalName,
    legalRepresentative,
    name,
    phone,
    postcode,
    region,
    registryId,
    url,
  }: {
    address: string | null
    city: string
    country: string | null
    descriptionPatch: Partial<IntlRecord>
    email: string
    legalName: string | null
    legalRepresentative: string | null
    name: string
    phone: string | null
    postcode: string | null
    region: string | null
    registryId: string | null
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

  const [profile] = await tx
    .select({ description: organizationProfiles.description })
    .from(organizationProfiles)
    .where(eq(organizationProfiles.organizationId, organizationId))
    .for('update')
  const description = mergeDescription(profile?.description ?? null, descriptionPatch)
  const values = {
    address,
    country,
    description,
    legalName,
    legalRepresentative,
    phone,
    postcode,
    region,
    registryId,
    url,
  }

  await tx
    .insert(organizationProfiles)
    .values({ ...values, organizationId })
    .onConflictDoUpdate({ target: organizationProfiles.organizationId, set: values })
}

export const removeMembership = async (
  tx: Transaction,
  {
    actorId,
    kind = 'removed',
    membershipId,
    organizationId,
  }: { actorId: string; membershipId: number; organizationId: number; kind?: 'left' | 'removed' }
) => {
  const [removed] = await tx
    .delete(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)))
    .returning({ role: memberships.role, userId: memberships.userId })
  if (!removed) throw memberError('NOT_FOUND')
  if (removed.role === 'admin') {
    const [owner] = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'admin')))
      .limit(1)
    if (!owner) throw memberError('LAST_OWNER')
  }

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

  const released =
    removed.role === 'tutor'
      ? await releaseTutorAssignments(tx, { actorId, organizationId, tutorId: removed.userId })
      : []

  const events: AppEvent[] = [
    ...released,
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
    kind === 'left'
      ? ({
          type: 'member.left',
          actorId,
          organizationId,
          data: { userId: removed.userId },
        } satisfies AppEvent<'member.left'>)
      : ({
          type: 'member.removed',
          actorId,
          organizationId,
          data: { userId: removed.userId },
        } satisfies AppEvent<'member.removed'>),
  ]
  await mapSequential(events, event => recordEvent(tx, event))

  return { events, removed }
}

export const changeMemberRole = async (
  tx: Transaction,
  {
    actorId,
    membershipId,
    organizationId,
    role,
  }: { actorId: string; membershipId: number; organizationId: number; role: OrganizationMembershipRole }
) => {
  if (role === 'admin') throw memberError('OWNER_ROLE')

  const [current] = await tx
    .select({ id: memberships.id, role: memberships.role, userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)))
    .for('update')
  if (!current) throw memberError('NOT_FOUND')
  if (current.userId === actorId) throw memberError('SELF')
  if (current.role === 'admin') throw memberError('OWNER_ROLE')
  if (current.role === role) throw memberError('INVALID')

  await tx.update(memberships).set({ role }).where(eq(memberships.id, current.id))

  const released =
    current.role === 'tutor'
      ? await releaseTutorAssignments(tx, { actorId, organizationId, tutorId: current.userId })
      : []
  const events: AppEvent[] = [
    ...released,
    {
      type: 'member.role_changed',
      actorId,
      organizationId,
      data: { previousRole: current.role, role, userId: current.userId },
    } satisfies AppEvent<'member.role_changed'>,
  ]
  await mapSequential(events, event => recordEvent(tx, event))

  return { events, previousRole: current.role, userId: current.userId }
}

export const transferOwnership = async (
  tx: Transaction,
  {
    actorId,
    newOwnerMembershipId,
    organizationId,
  }: { actorId: string; newOwnerMembershipId: number; organizationId: number }
) => {
  const rows = await tx
    .select({ id: memberships.id, onboardedAt: users.onboardedAt, role: memberships.role, userId: memberships.userId })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, organizationId))
    .for('update', { of: memberships })
  const owner = rows.find(({ role }) => role === 'admin')
  const target = rows.find(({ id }) => id === newOwnerMembershipId)
  if (!target) throw memberError('NOT_FOUND')
  if (owner?.userId !== actorId) throw memberError('FORBIDDEN')
  if (target.userId === owner.userId) throw memberError('SELF')
  if (target.role !== 'representative' || !target.onboardedAt) throw memberError('NOT_ELIGIBLE')

  await tx.update(memberships).set({ role: 'representative' }).where(eq(memberships.id, owner.id))
  await tx.update(memberships).set({ role: 'admin' }).where(eq(memberships.id, target.id))

  const event = {
    type: 'organization.ownership_transferred',
    actorId,
    organizationId,
    data: { newOwnerId: target.userId, previousOwnerId: owner.userId },
  } satisfies AppEvent<'organization.ownership_transferred'>
  await recordEvent(tx, event)

  return { event }
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

export const submitOrganizationApplication = async (
  tx: Transaction,
  { application, handle }: { application: ApplicationValues; handle: string }
) => {
  const organization = await createOrganization(tx, {
    city: application.city,
    country: application.country,
    email: application.email,
    handle,
    name: application.name,
    url: application.url,
  })
  const applicantName = fullName(application)

  await tx
    .update(organizationProfiles)
    .set({
      charterAcceptedAt: new Date().toISOString(),
      contactEmail: application.contactEmail,
      contactName: application.contactName,
      legalName: application.legalName,
      legalRepresentative: applicantName,
      motivation: application.motivation,
      registryId: application.registryId,
      volunteersPerYear: application.volunteersPerYear,
    })
    .where(eq(organizationProfiles.organizationId, organization.id))
  await tx.insert(organizationJoinRequests).values({
    email: application.registrantEmail,
    firstName: application.firstName,
    lastName: application.lastName,
    locale: application.locale ?? null,
    organizationId: organization.id,
    role: 'admin',
  })

  const event = {
    type: 'organization.application_received',
    actorId: null,
    organizationId: organization.id,
    data: {
      applicantEmail: application.registrantEmail,
      applicantName,
      city: application.city,
      country: application.country,
      locale: application.locale ?? null,
      message: application.motivation,
      organizationName: organization.name,
    },
  } satisfies AppEvent<'organization.application_received'>
  await recordEvent(tx, event)

  return { event, organization }
}

export const rejectOrganizationApplication = async (
  tx: Transaction,
  { comment, organizationId, reviewerId }: { comment: string | null; organizationId: number; reviewerId: string }
) => {
  const organization = await tx.query.organizations.findFirst({ where: eq(organizations.id, organizationId) })
  if (!organization) throw new Error('Organization not found')

  const request = await tx.query.organizationJoinRequests.findFirst({
    where: and(
      eq(organizationJoinRequests.organizationId, organizationId),
      eq(organizationJoinRequests.role, 'admin'),
      eq(organizationJoinRequests.status, 'pending')
    ),
  })
  if (!request) throw new Error('Registration request not found')

  const nowIso = new Date().toISOString()
  await tx
    .update(organizationJoinRequests)
    .set({
      rejectedAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: reviewerId,
      reviewerComment: comment,
      status: 'rejected',
    })
    .where(eq(organizationJoinRequests.id, request.id))

  const event = {
    type: 'organization.application_decided',
    actorId: reviewerId,
    organizationId,
    data: {
      applicantEmail: request.email,
      applicantName: fullName(request) || request.email,
      approved: false,
      comment,
      invitationUrl: null,
      locale: request.locale,
      organizationName: organization.name,
    },
  } satisfies AppEvent<'organization.application_decided'>
  await recordEvent(tx, event)

  return { event }
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
