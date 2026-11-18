import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { and, count, eq } from 'drizzle-orm'

import { listOrganizationActivity } from '@/actions/organizations/activity-core'
import { PENDING_CERTIFICATE_STATUSES, memberUserColumns, reviewerColumns } from '@/actions/organizations/helpers'
import { getViewerContext } from '@/actions/viewer'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import {
  type OrganizationMembershipRole,
  parseOrganization,
  parseOrganizationInvitation,
  parseOrganizationInviteLink,
} from '@/db/queries/organization'
import { buildChecklist, toPipeline } from '@/db/queries/organization-insights'
import {
  certificates,
  memberships,
  organizationInvitations,
  organizationInviteLinks,
  organizationJoinRequests,
  organizations,
} from '@/db/schema'
import { CacheTag, certificatesOrgTag } from '@/lib/cache'

export const queryOrganizationPanel = async (
  organizationId: number,
  role: OrganizationMembershipRole | null,
  userId: string
) => {
  const isManager = role === 'admin' || role === 'representative'

  const [
    organizationRecord,
    membershipRecords,
    joinRequestRecords,
    invitationRecords,
    inviteLinkRecords,
    pipelineRows,
    activity,
  ] = await Promise.all([
    db.query.organizations.findFirst({
      with: {
        profile: true,
      },
      where: eq(organizations.id, organizationId),
    }),
    db.query.memberships.findMany({
      where: eq(memberships.organizationId, organizationId),
      with: {
        user: { columns: memberUserColumns },
      },
      orderBy: (records, { asc }) => [asc(records.role), asc(records.createdAt)],
      limit: 500,
    }),
    isManager &&
      db.query.organizationJoinRequests.findMany({
        where: and(
          eq(organizationJoinRequests.organizationId, organizationId),
          eq(organizationJoinRequests.status, 'pending')
        ),
        with: {
          reviewer: { columns: reviewerColumns },
        },
        orderBy: (records, { desc }) => [desc(records.createdAt)],
        limit: 200,
      }),
    isManager &&
      db.query.organizationInvitations.findMany({
        where: eq(organizationInvitations.organizationId, organizationId),
        with: { invitedBy: { columns: reviewerColumns } },
        orderBy: (records, { desc }) => [desc(records.createdAt)],
        limit: 200,
      }),
    isManager &&
      db.query.organizationInviteLinks.findMany({
        where: eq(organizationInviteLinks.organizationId, organizationId),
        with: { createdBy: { columns: reviewerColumns } },
        orderBy: (records, { desc }) => [desc(records.createdAt)],
        limit: 50,
      }),
    db
      .select({ status: certificates.status, total: count() })
      .from(certificates)
      .where(eq(certificates.organizationId, organizationId))
      .groupBy(certificates.status),
    listOrganizationActivity(organizationId),
  ])

  if (!organizationRecord) {
    throw new Error('Organization not found')
  }

  const parsedOrganization = parseOrganization({
    ...organizationRecord,
    joinRequests: joinRequestRecords || [],
    memberships: membershipRecords,
  })

  const stats = parsedOrganization.memberships.reduce(
    (acc, member) => {
      if (member.isAdmin) acc.adminCount += 1
      if (member.isLearner) acc.learnerCount += 1
      if (member.isRepresentative) acc.representativeCount += 1
      if (member.isTutor) acc.tutorCount += 1
      if (member.isVolunteer) acc.volunteerCount += 1
      if (member.isPending) acc.pendingMemberCount += 1
      return acc
    },
    {
      adminCount: 0,
      learnerCount: 0,
      pendingMemberCount: 0,
      representativeCount: 0,
      tutorCount: 0,
      volunteerCount: 0,
    }
  )

  const invitations = (invitationRecords || []).map(record => parseOrganizationInvitation(record))
  const pipeline = toPipeline(pipelineRows)
  const pendingCertificatesCount = PENDING_CERTIFICATE_STATUSES.reduce((total, status) => total + pipeline[status], 0)
  const checklist = buildChecklist({
    certificateCount: Object.values(pipeline).reduce((total, value) => total + value, 0),
    invitedRoles: invitations.flatMap(invitation => (invitation.state === 'pending' ? [invitation.role] : [])),
    legalName: organizationRecord.profile?.legalName ?? null,
    legalRepresentative: organizationRecord.profile?.legalRepresentative ?? null,
    memberRoles: parsedOrganization.memberships.map(member => member.role),
    registryId: organizationRecord.profile?.registryId ?? null,
  })
  const inviteLinks = (inviteLinkRecords || []).map(record => parseOrganizationInviteLink(record))

  return {
    activity,
    approvedCertificatesCount: pipeline.approved,
    checklist,
    currentUserId: userId,
    inviteLinks,
    invitations,
    isOrgAdmin: role === 'admin',
    isRepresentative: role === 'representative',
    joinRequests: parsedOrganization.joinRequests,
    members: parsedOrganization.memberships,
    organization: { ...parsedOrganization, role },
    pendingCertificatesCount,
    pendingInvitationsCount: invitations.filter(({ state }) => state === 'pending').length,
    pendingJoinRequestsCount: parsedOrganization.joinRequests.length,
    pipeline,
    stats: {
      ...stats,
      memberCount: parsedOrganization.memberships.length,
    },
  }
}

const readOrganizationPanel = async (
  organizationId: number,
  role: OrganizationMembershipRole | null,
  userId: string
) => {
  'use cache'
  cacheTag(CacheTag.Organizations, certificatesOrgTag(organizationId))
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 })

  return await queryOrganizationPanel(organizationId, role, userId)
}

const fetchOrganizationPanel = async (
  organizationId: number,
  role: OrganizationMembershipRole | null,
  userId: string
) => await safeQuery(() => readOrganizationPanel(organizationId, role, userId))

export const loadOrganizationPanel = async () => {
  const { orgId, role, user } = await getViewerContext()
  if (!orgId) return { data: null, error: new Error('No active organization found') }
  return await fetchOrganizationPanel(orgId, role, user.id)
}

const readOrgTutors = async (organizationId: number) => {
  'use cache'
  cacheTag(CacheTag.Organizations)
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 })

  const result = await db.query.memberships.findMany({
    where: and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'tutor')),
    columns: {},
    with: {
      user: { columns: { id: true, firstName: true, lastName: true } },
    },
    limit: 200,
  })
  return result.map(m => m.user)
}

const fetchOrgTutors = async (organizationId: number) => await safeQuery(() => readOrgTutors(organizationId))

export const loadOrgTutors = async (organizationId: number) => {
  const { user } = await getViewerContext()
  const isManager =
    user.isAdmin ||
    user.organizations.some(({ id, role }) => id === organizationId && (role === 'admin' || role === 'representative'))
  if (!isManager) return { data: null, error: null }
  return await fetchOrgTutors(organizationId)
}
