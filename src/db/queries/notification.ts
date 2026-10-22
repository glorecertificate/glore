import { type InferSelectModel } from 'drizzle-orm'

import { timestampMillis } from '@/db/queries/organization'
import { type notifications } from '@/db/schema'

export const NOTIFICATION_CATEGORIES = ['certificates', 'learning', 'organization', 'account'] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]

export const NOTIFICATION_CATEGORY_PREFIXES = {
  account: ['account.', 'team.'],
  certificates: ['certificate.'],
  learning: ['course.', 'learning.'],
  organization: ['invitation.', 'invite_link.', 'join_request.', 'member.', 'organization.'],
} as const satisfies Record<NotificationCategory, readonly string[]>

type NotificationRow = InferSelectModel<typeof notifications>

export const notificationCategory = (type: string): NotificationCategory | null =>
  NOTIFICATION_CATEGORIES.find(category =>
    NOTIFICATION_CATEGORY_PREFIXES[category].some(prefix => type.startsWith(prefix))
  ) ?? null

export const notificationHref = (url: string | null) => {
  if (!url?.startsWith('/') || url.startsWith('//') || url.includes('\\')) return null
  return url
}

export const parseNotification = ({ createdAt, data, id, readAt, type, url }: NotificationRow) => ({
  category: notificationCategory(type),
  createdAt: new Date(timestampMillis(createdAt)).toISOString(),
  data,
  href: notificationHref(url),
  id,
  read: Boolean(readAt),
  type,
})

export type Notification = ReturnType<typeof parseNotification>
