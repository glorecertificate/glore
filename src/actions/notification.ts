'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache } from 'react'

import { desc, eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Notification } from '@/db/queries/notification'
import { notifications, users } from '@/db/schema'
import { type NotificationDataMap, type NotificationType } from '@/db/schema/notifications'
import { CacheTag } from '@/lib/cache'

const fetchNotifications = cache(async (userId: string) => {
  'use cache'
  cacheTag(CacheTag.Notifications)
  cacheLife('max')

  return await safeQuery(() =>
    db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
    })
  )
})

export const listNotifications = async (): Promise<{ data: Notification[] | null; error: unknown }> => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  const { data, error } = await fetchNotifications(authUser.id)
  if (error || !data) return { data: null, error }
  return { data, error: null }
}

export const getUnreadCount = async (): Promise<number> => {
  const authUser = await getAuthUser()
  if (!authUser) return 0

  const { data } = await fetchNotifications(authUser.id)
  if (!data) return 0
  return data.filter(n => !n.read).length
}

export const markNotificationRead = async (id: number) => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    const [updated] = await db
      .update(notifications)
      .set({ read: true, readAt: new Date().toISOString() })
      .where(eq(notifications.id, id))
      .returning()
    revalidateTag(CacheTag.Notifications, 'max')
    return updated
  })
}

export const markAllNotificationsRead = async () => {
  const authUser = await getAuthUser()
  if (!authUser) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  return await safeQuery(async () => {
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date().toISOString() })
      .where(eq(notifications.userId, authUser.id))
    revalidateTag(CacheTag.Notifications, 'max')
    return true
  })
}

export const createNotification = async <T extends NotificationType>(
  userId: string,
  type: T,
  data: NotificationDataMap[T]
) => {
  await db
    .insert(notifications)
    .values({ userId, type, data })
    .catch(() => null)
  revalidateTag(CacheTag.Notifications, 'max')
}

export const createNotificationByEmail = async <T extends NotificationType>(
  email: string,
  type: T,
  data: NotificationDataMap[T]
) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (!user) return
  await createNotification(user.id, type, data)
}
