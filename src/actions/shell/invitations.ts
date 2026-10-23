'use server'

import 'server-only'

import { and, asc, eq, gt, isNull, notInArray, or, sql } from 'drizzle-orm'

import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { memberships, organizationInvitations, organizations } from '@/db/schema'

export interface PendingInvitation {
  expiresAt: string
  id: number
  organizationName: string
  role: (typeof memberships.$inferSelect)['role']
}

export const listMyPendingInvitations = async () => {
  const user = await getCurrentUser()
  const memberOf = user.organizations.map(({ id }) => id)

  return await safeQuery(async (): Promise<PendingInvitation[]> => {
    const rows = await db
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
          gt(organizationInvitations.expiresAt, new Date().toISOString()),
          memberOf.length > 0 ? notInArray(organizationInvitations.organizationId, memberOf) : undefined,
          or(
            eq(organizationInvitations.userId, user.id),
            and(
              isNull(organizationInvitations.userId),
              sql`lower(${organizationInvitations.email}) = ${user.email.trim().toLowerCase()}`
            )
          )
        )
      )
      .orderBy(asc(organizationInvitations.expiresAt))
      .limit(20)
    return rows
  })
}
