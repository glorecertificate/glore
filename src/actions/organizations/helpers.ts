import 'server-only'

import { revalidateTag, updateTag } from 'next/cache'
import { cache } from 'react'

import { and, count, eq, isNull, or } from 'drizzle-orm'
import { Locale } from 'next-intl'

import { getCookie } from '@/actions/cookies'
import { findUser, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  type Organization,
  type OrganizationInvitation,
  type OrganizationInviteLink,
  type OrganizationJoinRequest,
  type OrganizationMember,
  type OrganizationMembershipRole,
} from '@/db/queries/organization'
import { memberships, users } from '@/db/schema'
import { CacheTag, userTag } from '@/lib/cache'
import { sendMail } from '@/lib/email'
import { DEFAULT_LOCALE, type IntlRecord, LOCALES } from '@/lib/i18n'

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

export const expireUserAccess = (userIds: string[]) => {
  for (const userId of new Set(userIds)) {
    updateTag(userTag(userId))
  }
}

export const listOrganizationMemberIds = async (organizationId: number) => {
  const members = await db.query.memberships.findMany({
    columns: { userId: true },
    where: eq(memberships.organizationId, organizationId),
  })
  return members.map(({ userId }) => userId)
}

export const revalidateOrganizationMembers = async (organizationId: number) => {
  const members = await db.query.memberships.findMany({
    columns: { userId: true },
    where: eq(memberships.organizationId, organizationId),
  })

  revalidateTag(CacheTag.Organizations, 'max')
  for (const { userId } of members) {
    revalidateTag(userTag(userId), 'max')
  }
}

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
  inviteLinks: OrganizationInviteLink[]
  invitations: OrganizationInvitation[]
  isOrgAdmin: boolean
  isRepresentative: boolean
  joinRequests: OrganizationJoinRequest[]
  members: OrganizationMember[]
  organization: Organization & { role: OrganizationMembershipRole | null }
  pendingCertificatesCount: number
  pendingInvitationsCount: number
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

export const canReviewRequestRole = (managerRole: OrganizationMembershipRole, targetRole: OrganizationMembershipRole) =>
  MANAGER_ROLES.includes(managerRole) && REQUESTABLE_ROLES.includes(targetRole)

export const getOrganizationAdminsCount = async (organizationId: number) => {
  const [result] = await db
    .select({ total: count() })
    .from(memberships)
    .where(and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'admin')))

  return result?.total ?? 0
}

export const getFreshCurrentUser = (userId: string) => findUser(userId, { cache: false })

export const getDescriptionRecord = (description: string, locale?: string, previous?: IntlRecord | null) => {
  const key = LOCALES.includes(locale as Locale) ? (locale as Locale) : DEFAULT_LOCALE
  return { ...(previous ?? {}), [key]: description } as IntlRecord
}

export const sendRegistrationRequestEmails = async ({
  city,
  country,
  message,
  organizationId,
  organizationName,
  registrantEmail,
  registrantName,
}: {
  city: string
  organizationId: number
  organizationName: string
  registrantEmail: string
  registrantName: string
  country?: string | null
  message?: string | null
}) => {
  const { data: admins } = await safeQuery(() =>
    db.query.users.findMany({
      columns: { email: true, firstName: true, locale: true },
      where: and(eq(users.role, 'admin'), or(isNull(users.banned), eq(users.banned, false))),
    })
  )

  if (!admins?.length) {
    console.error('No platform admin found to notify of a registration request')
    return
  }

  await Promise.all(
    admins.map(async admin => {
      try {
        await sendMail({
          to: admin.email,
          locale: admin.locale ?? DEFAULT_LOCALE,
          template: {
            name: 'organization/registration-request',
            props: {
              city,
              country,
              message,
              organizationId,
              organizationName,
              registrantEmail,
              registrantName,
              userName: admin.firstName,
            },
          },
        })
      } catch (error) {
        console.error(`Failed to notify admin ${admin.email} of a registration request:`, error)
      }
    })
  )
}
