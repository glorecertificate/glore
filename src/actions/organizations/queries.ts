'use server'

import 'server-only'

import { and, count, eq } from 'drizzle-orm'

import { listOrganizationActivity } from '@/actions/organizations/activity-core'
import {
  PENDING_CERTIFICATE_STATUSES,
  getOrganizationContext,
  memberUserColumns,
  reviewerColumns,
} from '@/actions/organizations/helpers'
import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseOrganization, parseOrganizationInvitation, parseOrganizationInviteLink } from '@/db/queries/organization'
import { buildChecklist, toPipeline } from '@/db/queries/organization-insights'
import {
  certificates,
  memberships,
  organizationInvitations,
  organizationInviteLinks,
  organizationJoinRequests,
  organizations,
} from '@/db/schema'

export type { OrganizationPanelData } from '@/actions/organizations/helpers'

export const getOrganizationPanel = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

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
        where: eq(organizations.id, organization.id),
      }),
      db.query.memberships.findMany({
        where: eq(memberships.organizationId, organization.id),
        with: {
          user: { columns: memberUserColumns },
        },
        orderBy: (records, { asc }) => [asc(records.role), asc(records.createdAt)],
        limit: 500,
      }),
      isManager &&
        db.query.organizationJoinRequests.findMany({
          where: and(
            eq(organizationJoinRequests.organizationId, organization.id),
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
          where: eq(organizationInvitations.organizationId, organization.id),
          with: { invitedBy: { columns: reviewerColumns } },
          orderBy: (records, { desc }) => [desc(records.createdAt)],
          limit: 200,
        }),
      isManager &&
        db.query.organizationInviteLinks.findMany({
          where: eq(organizationInviteLinks.organizationId, organization.id),
          with: { createdBy: { columns: reviewerColumns } },
          orderBy: (records, { desc }) => [desc(records.createdAt)],
          limit: 50,
        }),
      db
        .select({ status: certificates.status, total: count() })
        .from(certificates)
        .where(eq(certificates.organizationId, organization.id))
        .groupBy(certificates.status),
      listOrganizationActivity(organization.id),
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
      currentUserId: user.id,
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
  })
}

export const listOrgTutors = async (organizationId: number) => {
  const user = await getCurrentUser()
  const isManager = user.organizations.some(
    ({ id, role }) => id === organizationId && (role === 'admin' || role === 'representative')
  )
  if (!isManager) return { data: null, error: null }
  return await safeQuery(async () => {
    const result = await db.query.memberships.findMany({
      where: and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'tutor')),
      columns: {},
      with: {
        user: { columns: { id: true, firstName: true, lastName: true } },
      },
      limit: 200,
    })
    return result.map(m => m.user)
  })
}
