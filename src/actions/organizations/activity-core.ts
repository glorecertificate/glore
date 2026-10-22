import 'server-only'

import { and, desc, eq, inArray, lt } from 'drizzle-orm'

import { db } from '@/db/client'
import { type ActivityItem, activityUserIds, toActivityItems } from '@/db/queries/organization-insights'
import { activityEvents, users } from '@/db/schema'
import { fullName } from '@/lib/utils'

const ACTIVITY_PAGE_SIZE = 20

export interface ActivityPage {
  items: ActivityItem[]
  nextCursor: number | null
}

export const listOrganizationActivity = async (
  organizationId: number,
  { cursor, limit = ACTIVITY_PAGE_SIZE }: { cursor?: number; limit?: number } = {}
): Promise<ActivityPage> => {
  const rows = await db
    .select({
      action: activityEvents.action,
      actorId: activityEvents.actorId,
      createdAt: activityEvents.createdAt,
      id: activityEvents.id,
      metadata: activityEvents.metadata,
    })
    .from(activityEvents)
    .where(
      cursor
        ? and(eq(activityEvents.organizationId, organizationId), lt(activityEvents.id, cursor))
        : eq(activityEvents.organizationId, organizationId)
    )
    .orderBy(desc(activityEvents.id))
    .limit(limit + 1)

  const page = rows.slice(0, limit)
  const records = page.map(row => ({ ...row, metadata: row.metadata as Record<string, unknown> }))
  const ids = activityUserIds(records)
  const people =
    ids.length > 0
      ? await db
          .select({ email: users.email, firstName: users.firstName, id: users.id, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, ids))
      : []
  const names = new Map(people.map(person => [person.id, fullName(person) || person.email]))

  return {
    items: toActivityItems(records, names),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  }
}
