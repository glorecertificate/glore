import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { queryNotifications } from '@/actions/notifications/inbox-core'
import { safeQuery } from '@/db/helpers'
import { LIVE_LIFE, notificationsUserTag } from '@/lib/cache'

export const fetchNotificationPreview = async (userId: string, limit: number) => {
  'use cache'
  cacheTag(notificationsUserTag(userId))
  cacheLife(LIVE_LIFE)

  return await safeQuery(() => queryNotifications(userId, { filter: 'all', limit }))
}
