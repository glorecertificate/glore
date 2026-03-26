'use server'

import 'server-only'

import { and, count, eq, inArray } from 'drizzle-orm'

import {
  PENDING_CERTIFICATE_STATUSES,
  getOrganizationContext,
  memberUserColumns,
  reviewerColumns,
} from '@/actions/organization-helpers'
import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseOrganization } from '@/db/queries/organization'
import { certificates, memberships, organizationJoinRequests, organizations } from '@/db/schema'

export type { OrganizationPanelData } from '@/actions/organization-helpers'

export const getOrganizationPanel = async () => {
  const { organization, role, user } = await getOrganizationContext()

  return await safeQuery(async () => {
    if (!organization?.id) {
      throw new Error('No active organization found')
    }

    const [organizationRecord, membershipRecords, joinRequestRecords, pendingCertificates, approvedCertificates] =
      await Promise.all([
        db.query.organizations.findFirst({
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
        db
          .select({ total: count() })
          .from(certificates)
          .where(
            and(
              eq(certificates.organizationId, organization.id),
              inArray(certificates.status, [...PENDING_CERTIFICATE_STATUSES])
            )
          ),
        db
          .select({ total: count() })
          .from(certificates)
          .where(and(eq(certificates.organizationId, organization.id), eq(certificates.status, 'approved'))),
      ])

    if (!organizationRecord) {
      throw new Error('Organization not found')
    }

    const parsedOrganization = parseOrganization({
      ...organizationRecord,
      joinRequests: joinRequestRecords,
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

    return {
      approvedCertificatesCount: approvedCertificates[0]?.total ?? 0,
      currentUserId: user.id,
      isOrgAdmin: role === 'admin',
      isRepresentative: role === 'representative',
      joinRequests: parsedOrganization.joinRequests,
      members: parsedOrganization.memberships,
      organization: { ...parsedOrganization, role },
      pendingCertificatesCount: pendingCertificates[0]?.total ?? 0,
      pendingJoinRequestsCount: parsedOrganization.joinRequests.length,
      stats: {
        ...stats,
        memberCount: parsedOrganization.memberships.length,
      },
    }
  })
}

export const listOrgTutors = async (organizationId: number) => {
  await getCurrentUser()
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
