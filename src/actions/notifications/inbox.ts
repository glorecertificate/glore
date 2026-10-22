'use server'

import 'server-only'

import { and, count, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { queryError } from '@/db/helpers'
import { NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_PREFIXES, parseNotification } from '@/db/queries/notification'
import { notifications } from '@/db/schema'

const PAGE_SIZE = 20
const PAGE_LIMIT = 200

const listSchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  filter: z.enum(['all', 'unread']).default('all'),
  limit: z.number().int().min(1).max(PAGE_LIMIT).default(PAGE_SIZE),
})

export type ListNotificationsInput = z.input<typeof listSchema>

const unauthenticated = () => ({ code: 'UNAUTHORIZED', message: 'Not authenticated' })

const prefixMatch = (prefix: string) => sql`left(${notifications.type}, ${prefix.length}) = ${prefix}`

export const listNotifications = async (input: ListNotificationsInput = {}) => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  const parsed = listSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid filters' } }
  const { category, filter, limit } = parsed.data

  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.id),
          filter === 'unread' ? isNull(notifications.readAt) : undefined,
          category ? or(...NOTIFICATION_CATEGORY_PREFIXES[category].map(prefixMatch)) : undefined
        )
      )
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit + 1)

    return { data: { hasMore: rows.length > limit, items: rows.slice(0, limit).map(parseNotification) }, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const countUnreadNotifications = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  try {
    const [row] = await db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
    return { data: row?.total ?? 0, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const markNotificationRead = async (id: number) => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }
  if (!Number.isInteger(id) || id <= 0) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid id' } }

  try {
    await db
      .update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id), isNull(notifications.readAt)))
    return { data: true, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const markAllNotificationsRead = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  try {
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
      .returning({ id: notifications.id })
    return { data: updated.length, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}
