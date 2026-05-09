import 'server-only'

import { cache } from 'react'

import { and, count, eq } from 'drizzle-orm'

import { getCookie } from '@/actions/cookies'
import { findUser, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import {
  type Organization,
  type OrganizationJoinRequest,
  type OrganizationMember,
  type OrganizationMembershipRole,
} from '@/db/queries/organization'
import { memberships } from '@/db/schema'
import { sendMail } from '@/lib/email'
import { type IntlRecord, i18n } from '@/lib/i18n'

const MANAGER_ROLES: OrganizationMembershipRole[] = ['admin', 'representative']
const MANAGEABLE_MEMBER_ROLES: OrganizationMembershipRole[] = [
  'admin',
  'learner',
  'representative',
  'tutor',
  'volunteer',
]
const REQUESTABLE_ROLES: OrganizationMembershipRole[] = ['learner', 'volunteer']
const REPRESENTATIVE_MANAGED_ROLES: OrganizationMembershipRole[] = ['learner', 'tutor', 'volunteer']
export const PENDING_CERTIFICATE_STATUSES = ['changes_requested', 'in_review', 'submitted'] as const

export const memberUserColumns = {
  avatarUrl: true,
  createdAt: true,
  email: true,
  firstName: true,
  id: true,
  lastName: true,
  onboardedAt: true,
  username: true,
} as const

export const reviewerColumns = {
  email: true,
  firstName: true,
  id: true,
  lastName: true,
} as const

export interface OrganizationPanelData {
  approvedCertificatesCount: number
  currentUserId: string
  isOrgAdmin: boolean
  isRepresentative: boolean
  joinRequests: OrganizationJoinRequest[]
  members: OrganizationMember[]
  organization: Organization & { role: OrganizationMembershipRole | null }
  pendingCertificatesCount: number
  pendingJoinRequestsCount: number
  stats: {
    adminCount: number
    learnerCount: number
    memberCount: number
    pendingMemberCount: number
    representativeCount: number
    tutorCount: number
    volunteerCount: number
  }
}

export const getOrganizationContext = cache(async () => {
  const [user, storedOrgId] = await Promise.all([getCurrentUser(), getCookie('org')])
  const organization = user.organizations.find(({ id }) => id === storedOrgId) ?? user.organizations[0] ?? null

  return {
    organization,
    role: organization?.role ?? null,
    user,
  }
})
export const assertOrganizationManager = (role: OrganizationMembershipRole | null) => {
  if (!role || !MANAGER_ROLES.includes(role)) {
    throw new Error('You do not have permission to manage this organization')
  }
}

export const assertOrganizationAdmin = (role: OrganizationMembershipRole | null) => {
  if (role !== 'admin') {
    throw new Error('Only organization admins can manage this section')
  }
}

export const canManageMemberRole = (
  managerRole: OrganizationMembershipRole,
  targetRole: OrganizationMembershipRole
) => {
  if (managerRole === 'admin') {
    return MANAGEABLE_MEMBER_ROLES.includes(targetRole)
  }
  return REPRESENTATIVE_MANAGED_ROLES.includes(targetRole)
}

export const canInviteRole = (managerRole: OrganizationMembershipRole, targetRole: OrganizationMembershipRole) => {
  if (managerRole === 'admin') {
    return MANAGEABLE_MEMBER_ROLES.includes(targetRole)
  }
  return REPRESENTATIVE_MANAGED_ROLES.includes(targetRole)
}

export const canReviewRequestRole = (
  managerRole: OrganizationMembershipRole,
  targetRole: OrganizationMembershipRole
) => {
  if (managerRole === 'admin') {
    return REQUESTABLE_ROLES.includes(targetRole)
  }
  return REPRESENTATIVE_MANAGED_ROLES.includes(targetRole)
}

export const getOrganizationAdminsCount = async (organizationId: number) => {
  const [result] = await db
    .select({ total: count() })
    .from(memberships)
    .where(and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'admin')))

  return result?.total ?? 0
}

export const getFreshCurrentUser = (userId: string) => findUser(userId, { cache: false })

export const getDescriptionRecord = (description: string, locale?: string, previous?: IntlRecord | null) => {
  const localeKey = i18n.locales.includes(locale as (typeof i18n.locales)[number])
    ? (locale as (typeof i18n.locales)[number])
    : i18n.defaultLocale

  return {
    ...(previous ?? {}),
    [localeKey]: description,
  } as IntlRecord
}

export const sendOrganizationAccessEmail = async ({
  email,
  inviterName,
  isNewUser,
  organizationName,
  role,
}: {
  email: string
  inviterName: string
  isNewUser: boolean
  organizationName: string
  role: OrganizationMembershipRole
}) => {
  const roleLabel = role.replace('_', ' ')

  try {
    await sendMail({
      to: email,
      template: {
        name: 'organization/member-added',
        props: { organizationName, inviterName, role: roleLabel, isNewUser },
      },
    })
    return true
  } catch {
    return false
  }
}

export const sendJoinRequestDecisionEmail = async ({
  email,
  organizationName,
  reviewerComment,
  status,
}: {
  email: string
  organizationName: string
  reviewerComment?: string | null
  status: 'accepted' | 'rejected'
}) => {
  await sendMail({
    to: email,
    template: {
      name: 'organization/join-request',
      props: { organizationName, status, comment: reviewerComment },
    },
  }).catch(() => null)
}
