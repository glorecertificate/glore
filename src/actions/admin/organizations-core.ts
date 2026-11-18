import 'server-only'

import { count, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseAdminOrganization } from '@/db/queries/organization'
import { memberships, organizationJoinRequests } from '@/db/schema'

export const loadOrganizations = () =>
  safeQuery(async () => {
    const [rows, requests, memberCounts] = await Promise.all([
      db.query.organizations.findMany({
        orderBy: (record, { desc: orderDesc }) => [orderDesc(record.createdAt)],
        with: {
          profile: true,
        },
        limit: 1000,
      }),
      db.query.organizationJoinRequests.findMany({
        columns: {
          createdAt: true,
          email: true,
          firstName: true,
          id: true,
          lastName: true,
          locale: true,
          message: true,
          organizationId: true,
          role: true,
          status: true,
          updatedAt: true,
          acceptedAt: true,
          rejectedAt: true,
          reviewedAt: true,
          reviewedBy: true,
          reviewerComment: true,
          userId: true,
          inviteLinkId: true,
        },
        where: eq(organizationJoinRequests.role, 'admin'),
        limit: 1000,
      }),
      db
        .select({ organizationId: memberships.organizationId, total: count() })
        .from(memberships)
        .groupBy(memberships.organizationId),
    ])

    const requestMap = new Map(requests.map(r => [r.organizationId, r]))
    const countMap = new Map(memberCounts.map(m => [m.organizationId, m.total]))

    return rows.map(org =>
      parseAdminOrganization({
        ...org,
        memberCount: countMap.get(org.id) ?? 0,
        registrationRequest: requestMap.get(org.id) ?? null,
      })
    )
  })
