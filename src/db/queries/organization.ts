import { type InferSelectModel } from 'drizzle-orm'

import {
  type memberships,
  type organizationInvitations,
  type organizationInviteLinks,
  type organizationJoinRequests,
  type organizationProfiles,
  type organizations,
  type users,
} from '@/db/schema'
import { type EnumType } from '@/db/types'
import { type IntlRecord } from '@/lib/i18n'
import { fullName } from '@/lib/utils'

type OrganizationRow = InferSelectModel<typeof organizations>
type OrganizationProfileRow = InferSelectModel<typeof organizationProfiles>
type MembershipRow = Pick<
  InferSelectModel<typeof memberships>,
  'createdAt' | 'id' | 'organizationId' | 'role' | 'updatedAt'
>
type JoinRequestRow = InferSelectModel<typeof organizationJoinRequests>
type MemberUserRow = Pick<
  InferSelectModel<typeof users>,
  'avatarUrl' | 'createdAt' | 'email' | 'firstName' | 'id' | 'lastName' | 'onboardedAt' | 'username'
>
type ReviewerRow = Pick<InferSelectModel<typeof users>, 'email' | 'firstName' | 'id' | 'lastName'>
type InvitationRow = InferSelectModel<typeof organizationInvitations>
type InviteLinkRow = InferSelectModel<typeof organizationInviteLinks>

export type OrganizationMembershipRole = EnumType<'role'>

export const INVITATION_ERROR_CODES = [
  'ACCEPTED',
  'ACCOUNT_EXISTS',
  'ALREADY_INVITED',
  'ALREADY_MEMBER',
  'ALREADY_REQUESTED',
  'AUTH_ERROR',
  'DECLINED',
  'EXPIRED',
  'FORBIDDEN',
  'INVALID',
  'LINK_EXHAUSTED',
  'LINK_EXPIRED',
  'LINK_REVOKED',
  'MISMATCH',
  'NOT_FOUND',
  'PROOF_REQUIRED',
  'RATE_LIMITED',
  'REQUEST_DECIDED',
  'REVOKED',
  'ROLE_TAKEN',
  'TOO_SOON',
] as const

export type InvitationErrorCode = (typeof INVITATION_ERROR_CODES)[number]

export const MEMBER_ERROR_CODES = [
  'CONFIRMATION',
  'FORBIDDEN',
  'HAS_CERTIFICATES',
  'INVALID',
  'LAST_OWNER',
  'NOT_ELIGIBLE',
  'NOT_FOUND',
  'OWNER_ROLE',
  'RATE_LIMITED',
  'SELF',
] as const

export type MemberErrorCode = (typeof MEMBER_ERROR_CODES)[number]
export type InvitationState = 'accepted' | 'declined' | 'expired' | 'pending' | 'revoked'
export type InviteLinkState = 'active' | 'exhausted' | 'expired' | 'revoked'
export type OrganizationInvitation = ReturnType<typeof parseOrganizationInvitation>
export type OrganizationInviteLink = ReturnType<typeof parseOrganizationInviteLink>

export type Organization = ReturnType<typeof parseOrganization>
export type OrganizationMember = ReturnType<typeof parseOrganizationMember>
export type OrganizationJoinRequest = ReturnType<typeof parseOrganizationJoinRequest>

const mergeOrganizationProfile = <T extends OrganizationRow & { profile: OrganizationProfileRow | null }>(
  organization: T
) => {
  const { profile, ...rest } = organization

  return {
    ...rest,
    address: profile?.address ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    charterAcceptedAt: profile?.charterAcceptedAt ?? null,
    contactEmail: profile?.contactEmail ?? null,
    contactName: profile?.contactName ?? null,
    country: profile?.country ?? null,
    description: profile?.description ?? null,
    legalName: profile?.legalName ?? null,
    legalRepresentative: profile?.legalRepresentative ?? null,
    motivation: profile?.motivation ?? null,
    phone: profile?.phone ?? null,
    postcode: profile?.postcode ?? null,
    rating: profile?.rating ?? null,
    region: profile?.region ?? null,
    registryId: profile?.registryId ?? null,
    signatureUrl: profile?.signatureUrl ?? null,
    url: profile?.url ?? null,
    volunteersPerYear: profile?.volunteersPerYear ?? null,
  }
}

export const parseOrganization = (
  organization: OrganizationRow & {
    profile: OrganizationProfileRow | null
    joinRequests: (JoinRequestRow & { reviewer?: ReviewerRow | null })[]
    memberships: (MembershipRow & { user: MemberUserRow })[]
  }
) => ({
  ...mergeOrganizationProfile(organization),
  joinRequests: organization.joinRequests.map(parseOrganizationJoinRequest),
  memberships: organization.memberships.map(parseOrganizationMember),
})

const parseOrganizationMember = (membership: MembershipRow & { user: MemberUserRow }) => ({
  ...membership,
  fullName: fullName(membership.user),
  isAdmin: membership.role === 'admin',
  isLearner: membership.role === 'learner',
  isPending: !membership.user.onboardedAt,
  isRepresentative: membership.role === 'representative',
  isTutor: membership.role === 'tutor',
  isVolunteer: membership.role === 'volunteer',
})

const REPRESENTATIVE_MANAGED_ROLES: OrganizationMembershipRole[] = ['learner', 'tutor', 'volunteer']

const MANAGEABLE_ROLES: OrganizationMembershipRole[] = ['admin', 'learner', 'representative', 'tutor', 'volunteer']

export const canManageMemberRole = (managerRole: OrganizationMembershipRole, targetRole: OrganizationMembershipRole) =>
  (managerRole === 'admin' ? MANAGEABLE_ROLES : REPRESENTATIVE_MANAGED_ROLES).includes(targetRole)

export const canInviteRole = (managerRole: OrganizationMembershipRole, targetRole: OrganizationMembershipRole) =>
  managerRole === 'admin' || REPRESENTATIVE_MANAGED_ROLES.includes(targetRole)

export const canManageInvitation = (
  managerRole: OrganizationMembershipRole,
  invitation: { invitedById: string | null; role: OrganizationMembershipRole },
  userId: string
) => canInviteRole(managerRole, invitation.role) || invitation.invitedById === userId

export const mergeDescription = (current: Partial<IntlRecord> | null, patch: Partial<IntlRecord>) => {
  const merged = Object.fromEntries(
    Object.entries({ ...current, ...patch }).filter(([, value]) => typeof value === 'string' && value.trim())
  )
  return Object.keys(merged).length > 0 ? (merged as IntlRecord) : null
}

export const timestampMillis = (value: string) => {
  const iso = value.replace(' ', 'T')
  return Date.parse(/(?:Z|[+-]\d{2}(?::?\d{2})?)$/u.test(iso) ? iso : `${iso}Z`)
}

export const invitationState = (
  invitation: Pick<InvitationRow, 'acceptedAt' | 'declinedAt' | 'expiresAt' | 'revokedAt'>,
  now = Date.now()
): InvitationState => {
  if (invitation.acceptedAt) return 'accepted'
  if (invitation.declinedAt) return 'declined'
  if (invitation.revokedAt) return 'revoked'
  if (timestampMillis(invitation.expiresAt) <= now) return 'expired'
  return 'pending'
}

export const inviteLinkState = (
  link: Pick<InviteLinkRow, 'expiresAt' | 'maxUses' | 'revokedAt' | 'uses'>,
  now = Date.now()
): InviteLinkState => {
  if (link.revokedAt) return 'revoked'
  if (link.expiresAt && timestampMillis(link.expiresAt) <= now) return 'expired'
  if (link.maxUses !== null && link.uses >= link.maxUses) return 'exhausted'
  return 'active'
}

export const parseOrganizationInvitation = (
  {
    invitedBy,
    tokenCipher: _tokenCipher,
    tokenHash: _tokenHash,
    ...invitation
  }: InvitationRow & { invitedBy?: ReviewerRow | null },
  now = Date.now()
) => ({
  ...invitation,
  inviterName: invitedBy ? fullName(invitedBy) || invitedBy.email : null,
  state: invitationState(invitation, now),
})

export const parseOrganizationInviteLink = (
  {
    createdBy,
    tokenCipher: _tokenCipher,
    tokenHash: _tokenHash,
    ...link
  }: InviteLinkRow & { createdBy?: ReviewerRow | null },
  now = Date.now()
) => ({
  ...link,
  creatorName: createdBy ? fullName(createdBy) || createdBy.email : null,
  state: inviteLinkState(link, now),
})

const parseOrganizationJoinRequest = (request: JoinRequestRow & { reviewer?: ReviewerRow | null }) => ({
  ...request,
  fullName: fullName(request),
  isAccepted: request.status === 'accepted',
  isPending: request.status === 'pending',
  isRejected: request.status === 'rejected',
})

export type AdminOrganization = ReturnType<typeof parseAdminOrganization>

export const parseAdminOrganization = (
  org: OrganizationRow & {
    profile: OrganizationProfileRow | null
    registrationRequest: JoinRequestRow | null
    memberCount?: number
  }
) => {
  const isRejected = org.registrationRequest?.status === 'rejected'

  return {
    ...mergeOrganizationProfile(org),
    isApproved: !!org.approvedAt,
    isPending: !org.approvedAt && !isRejected,
    isRejected,
    memberCount: org.memberCount ?? 0,
    registrationRequest: org.registrationRequest
      ? {
          ...org.registrationRequest,
          fullName: fullName(org.registrationRequest),
        }
      : null,
  }
}
