'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { and, count, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { queryNotifications } from '@/actions/notifications/inbox-core'
import { db } from '@/db/client'
import { queryError } from '@/db/helpers'
import { NOTIFICATION_CATEGORIES } from '@/db/queries/notification'
import { notifications } from '@/db/schema'
import { notificationsUserTag } from '@/lib/cache'

const PAGE_SIZE = 20
const PAGE_LIMIT = 200

const listSchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  filter: z.enum(['all', 'unread']).default('all'),
  limit: z.number().int().min(1).max(PAGE_LIMIT).default(PAGE_SIZE),
})

export type ListNotificationsInput = z.input<typeof listSchema>

const unauthenticated = () => ({ code: 'UNAUTHORIZED', message: 'Not authenticated' })

export const listNotifications = async (input: ListNotificationsInput = {}) => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: unauthenticated() }

  const parsed = listSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: { code: 'INVALID_INPUT', message: 'Invalid filters' } }

  try {
    return { data: await queryNotifications(user.id, parsed.data), error: null }
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
    updateTag(notificationsUserTag(user.id))
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
    updateTag(notificationsUserTag(user.id))
    return { data: updated.length, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}
