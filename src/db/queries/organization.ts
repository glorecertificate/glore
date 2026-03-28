import { type InferSelectModel } from 'drizzle-orm'

import {
  type memberships,
  type organizationJoinRequests,
  type organizationProfiles,
  type organizations,
  type users,
} from '@/db/schema'
import { type EnumType } from '@/db/types'

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

export type OrganizationMembershipRole = EnumType<'role'>

export interface OrganizationMemberWithRelations extends MembershipRow {
  user: MemberUserRow
}

export interface OrganizationJoinRequestWithRelations extends JoinRequestRow {
  reviewer?: ReviewerRow | null
}

export interface OrganizationWithRelations extends OrganizationRow {
  profile: OrganizationProfileRow | null
  joinRequests: OrganizationJoinRequestWithRelations[]
  memberships: OrganizationMemberWithRelations[]
}

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
    country: profile?.country ?? null,
    description: profile?.description ?? null,
    phone: profile?.phone ?? null,
    postcode: profile?.postcode ?? null,
    rating: profile?.rating ?? null,
    region: profile?.region ?? null,
    url: profile?.url ?? null,
  }
}

export const parseOrganization = (organization: OrganizationWithRelations) => ({
  ...mergeOrganizationProfile(organization),
  joinRequests: organization.joinRequests.map(parseOrganizationJoinRequest),
  memberships: organization.memberships.map(parseOrganizationMember),
})

export const parseOrganizationMember = (membership: OrganizationMemberWithRelations) => ({
  ...membership,
  fullName: [membership.user.firstName, membership.user.lastName].filter(Boolean).join(' '),
  isAdmin: membership.role === 'admin',
  isLearner: membership.role === 'learner',
  isPending: !membership.user.onboardedAt,
  isRepresentative: membership.role === 'representative',
  isTutor: membership.role === 'tutor',
  isVolunteer: membership.role === 'volunteer',
})

export const parseOrganizationJoinRequest = (request: OrganizationJoinRequestWithRelations) => ({
  ...request,
  fullName: [request.firstName, request.lastName].filter(Boolean).join(' '),
  isAccepted: request.status === 'accepted',
  isPending: request.status === 'pending',
  isRejected: request.status === 'rejected',
})

export interface AdminOrganizationWithRelations extends OrganizationRow {
  profile: OrganizationProfileRow | null
  registrationRequest: JoinRequestRow | null
}

export type AdminOrganization = ReturnType<typeof parseAdminOrganization>

export const parseAdminOrganization = (org: AdminOrganizationWithRelations) => ({
  ...mergeOrganizationProfile(org),
  isApproved: !!org.approvedAt,
  isPending: !org.approvedAt,
  registrationRequest: org.registrationRequest
    ? {
        ...org.registrationRequest,
        fullName: [org.registrationRequest.firstName, org.registrationRequest.lastName].filter(Boolean).join(' '),
      }
    : null,
})
