import 'server-only'

import { and, eq, inArray, isNull, or } from 'drizzle-orm'

import { db } from '@/db/client'
import { parseUser, userWith } from '@/db/queries/user'
import { teamInvitations, users } from '@/db/schema'

export const queryTeamMembers = async () => {
  const result = await db.query.users.findMany({
    where: or(eq(users.role, 'admin'), eq(users.isEditor, true)),
    with: userWith,
    limit: 500,
  })
  const open = await db
    .select({ userId: teamInvitations.userId })
    .from(teamInvitations)
    .where(
      and(
        isNull(teamInvitations.acceptedAt),
        inArray(
          teamInvitations.userId,
          result.map(({ id }) => id)
        )
      )
    )
  const openIds = new Set(open.map(({ userId }) => userId))
  return result.map(user => ({ ...parseUser(user), invitationOpen: openIds.has(user.id) }))
}
