import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users'

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text().notNull().unique(),
    keys: jsonb().$type<{ auth: string; p256dh: string }>().notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  },
  table => [index('push_subscriptions_user_id_idx').on(table.userId)]
)
