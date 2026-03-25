'use server'

import 'server-only'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { cache } from 'react'

import { and, desc, eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { type Notification } from '@/db/queries/notification'
import { notifications, pushSubscriptions, users } from '@/db/schema'
import { type NotificationDataMap, type NotificationType } from '@/db/schema/notifications'
import { CacheTag } from '@/lib/cache'
import { sendPushNotification } from '@/lib/push'

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
      .where(and(eq(notifications.id, id), eq(notifications.userId, authUser.id)))
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

  const subs = await db.query.pushSubscriptions.findMany({ where: eq(pushSubscriptions.userId, userId) })
  const payload = buildPushPayload(type, data as NotificationDataMap[NotificationType])
  for (const sub of subs) {
    void sendPushNotification(sub, payload)
  }
}

const buildPushPayload = (type: NotificationType, data: NotificationDataMap[NotificationType]) => {
  if (type === 'certificate_assigned') {
    return { body: 'A certificate has been assigned to you for review.', title: 'GloRe' }
  }
  if (type === 'certificate_reviewed') {
    const d = data as NotificationDataMap['certificate_reviewed']
    return {
      body: d.status === 'approved' ? 'Your certificate has been approved.' : 'Your certificate requires changes.',
      title: 'GloRe',
      url: `/certificates/${d.certificateId}`,
    }
  }
  if (type === 'member_added') {
    const d = data as NotificationDataMap['member_added']
    return { body: `You have been added to ${d.organizationName}.`, title: 'GloRe' }
  }
  if (type === 'join_request_decided') {
    const d = data as NotificationDataMap['join_request_decided']
    const body =
      d.status === 'accepted'
        ? `Your request to join ${d.organizationName} was accepted.`
        : d.comment
          ? `Your request to join ${d.organizationName} was rejected. ${d.comment}`
          : `Your request to join ${d.organizationName} was rejected.`
    return { body, title: 'GloRe' }
  }
  return { body: 'You have a new notification.', title: 'GloRe' }
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
