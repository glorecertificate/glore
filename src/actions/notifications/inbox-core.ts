import 'server-only'

import { and, desc, eq, isNull, or, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { NOTIFICATION_CATEGORY_PREFIXES, type NotificationCategory, parseNotification } from '@/db/queries/notification'
import { notifications } from '@/db/schema'

const prefixMatch = (prefix: string) => sql`left(${notifications.type}, ${prefix.length}) = ${prefix}`

export const queryNotifications = async (
  userId: string,
  { category, filter, limit }: { category?: NotificationCategory; filter: 'all' | 'unread'; limit: number }
) => {
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        filter === 'unread' ? isNull(notifications.readAt) : undefined,
        category ? or(...NOTIFICATION_CATEGORY_PREFIXES[category].map(prefixMatch)) : undefined
      )
    )
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit + 1)

  return { hasMore: rows.length > limit, items: rows.slice(0, limit).map(parseNotification) }
}
