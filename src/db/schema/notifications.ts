import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { type JsonbObject } from './helpers'
import { users } from './users'

export const notifications = pgTable(
  'notifications',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text().notNull(),
    data: jsonb().$type<JsonbObject>().default({}).notNull(),
    url: text(),
    readAt: timestamp({ mode: 'string' }),
    emailedAt: timestamp({ mode: 'string' }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  },
  table => [index('notifications_user_id_read_at_idx').on(table.userId, table.readAt, table.createdAt)]
)
