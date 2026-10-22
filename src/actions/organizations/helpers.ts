import 'server-only'

import { revalidateTag, updateTag } from 'next/cache'
import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { expireCertificateCaches } from '@/actions/certificates/helpers'
import { getCookie } from '@/actions/cookies'
import { notify } from '@/actions/notifications/notify'
import { type ActivityPage } from '@/actions/organizations/activity-core'
import { findUser, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { memberError } from '@/db/mutations/organization'
import { type AppEvent } from '@/db/queries/activity-event'
import {
  type Organization,
  type OrganizationInvitation,
  type OrganizationInviteLink,
  type OrganizationJoinRequest,
  type OrganizationMember,
  type OrganizationMembershipRole,
} from '@/db/queries/organization'
import { type OrganizationChecklist, type Pipeline } from '@/db/queries/organization-insights'
import { memberships } from '@/db/schema'
import { CacheTag, userTag } from '@/lib/cache'

const MANAGER_ROLES: OrganizationMembershipRole[] = ['admin', 'representative']
const REQUESTABLE_ROLES: OrganizationMembershipRole[] = ['learner', 'volunteer']
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
  activity: ActivityPage
  approvedCertificatesCount: number
  checklist: OrganizationChecklist
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
  pipeline: Pipeline
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
export const getOrganizationAccess = async (organizationId?: number) => {
  const { organization, user } = await getOrganizationContext()
  const id = organizationId ?? organization?.id
  if (!id) throw memberError('FORBIDDEN')
  if (organizationId !== undefined && user.isAdmin) {
    return { organizationId: id, platform: true, role: 'admin' as OrganizationMembershipRole, user }
  }
  const membership = user.organizations.find(item => item.id === id)
  if (!membership) throw memberError('FORBIDDEN')
  return { organizationId: id, platform: false, role: membership.role, user }
}

export const settleEvents = async (events: AppEvent[]) => {
  for (const event of events) {
    if (
      event.type === 'certificate.unassigned' &&
      event.organizationId &&
      'holderId' in event.data &&
      'previousTutorId' in event.data
    ) {
      expireCertificateCaches(
        { organizationId: event.organizationId, userId: event.data.holderId },
        event.data.previousTutorId
      )
    }
  }
  await Promise.all(events.map(event => notify(event)))
}

export const assertOrganizationManager = (role: OrganizationMembershipRole | null) => {
  if (!role || !MANAGER_ROLES.includes(role)) {
    throw new Error('You do not have permission to manage this organization')
  }
}

export const canReviewRequestRole = (managerRole: OrganizationMembershipRole, targetRole: OrganizationMembershipRole) =>
  MANAGER_ROLES.includes(managerRole) && REQUESTABLE_ROLES.includes(targetRole)

export const getFreshCurrentUser = (userId: string) => findUser(userId, { cache: false })
