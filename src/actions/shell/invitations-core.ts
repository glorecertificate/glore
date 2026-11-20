import 'server-only'

import { cache } from 'react'

import { and, asc, eq, gt, isNull, notInArray, or, sql } from 'drizzle-orm'

import { readClock } from '@/actions/dashboard/now'
import { getViewer } from '@/actions/viewer'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { memberships, organizationInvitations, organizations } from '@/db/schema'

export interface PendingInvitation {
  expiresAt: string
  id: number
  organizationName: string
  role: (typeof memberships.$inferSelect)['role']
}

export const findPendingInvitations = async ({
  email,
  memberOf,
  now,
  userId,
}: {
  email: string
  memberOf: number[]
  now: number
  userId: string
}) =>
  await safeQuery(
    async (): Promise<PendingInvitation[]> =>
      await db
        .select({
          expiresAt: organizationInvitations.expiresAt,
          id: organizationInvitations.id,
          organizationName: organizations.name,
          role: organizationInvitations.role,
        })
        .from(organizationInvitations)
        .innerJoin(organizations, eq(organizations.id, organizationInvitations.organizationId))
        .where(
          and(
            isNull(organizationInvitations.acceptedAt),
            isNull(organizationInvitations.declinedAt),
            isNull(organizationInvitations.revokedAt),
            gt(organizationInvitations.expiresAt, new Date(now).toISOString()),
            memberOf.length > 0 ? notInArray(organizationInvitations.organizationId, memberOf) : undefined,
            or(
              eq(organizationInvitations.userId, userId),
              and(
                isNull(organizationInvitations.userId),
                sql`lower(${organizationInvitations.email}) = ${email.trim().toLowerCase()}`
              )
            )
          )
        )
        .orderBy(asc(organizationInvitations.expiresAt))
        .limit(20)
  )

export const loadViewerInvitations = cache(async () => {
  const [user, now] = await Promise.all([getViewer(), readClock()])
  const { data } = await findPendingInvitations({
    email: user.email,
    memberOf: user.organizations.map(({ id }) => id),
    now,
    userId: user.id,
  })
  return data ?? []
})
