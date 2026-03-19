import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users'

export interface NotificationDataMap {
  certificate_assigned: { certificateId: number; organizationName?: string }
  certificate_reviewed: { certificateId: number; status: 'approved' | 'changes_requested' }
  join_request_decided: { organizationName: string; status: 'accepted' | 'rejected' }
  member_added: { organizationName: string; role: string }
}

export type NotificationType = keyof NotificationDataMap

export const notifications = pgTable('notifications', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text().$type<NotificationType>().notNull(),
  data: jsonb().$type<NotificationDataMap[NotificationType]>().notNull(),
  read: boolean().default(false).notNull(),
  readAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
