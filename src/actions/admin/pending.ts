'use server'

import 'server-only'

import { cacheTag } from 'next/cache'

import { and, count, eq, isNull, notExists, or } from 'drizzle-orm'

import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { organizationJoinRequests, organizations, users } from '@/db/schema'
import { CacheTag } from '@/lib/cache'

const fetchPendingCounts = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations, CacheTag.TeamMembers)

  return await safeQuery(async () => {
    const [organizationRows, teamRows] = await Promise.all([
      db
        .select({ total: count() })
        .from(organizations)
        .where(
          and(
            isNull(organizations.approvedAt),
            notExists(
              db
                .select({ id: organizationJoinRequests.id })
                .from(organizationJoinRequests)
                .where(
                  and(
                    eq(organizationJoinRequests.organizationId, organizations.id),
                    eq(organizationJoinRequests.role, 'admin'),
                    eq(organizationJoinRequests.status, 'rejected')
                  )
                )
            )
          )
        ),
      db
        .select({ total: count() })
        .from(users)
        .where(and(or(eq(users.role, 'admin'), eq(users.isEditor, true)), isNull(users.onboardedAt))),
    ])

    return {
      organizations: organizationRows[0]?.total ?? 0,
      team: teamRows[0]?.total ?? 0,
    }
  })
}

export const getPendingCounts = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { organizations: 0, team: 0 }

  const { data } = await fetchPendingCounts()

  return data ?? { organizations: 0, team: 0 }
}
