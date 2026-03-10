import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users'

export const sessions = pgTable('sessions', {
  id: text().primaryKey(),
  expiresAt: timestamp({ mode: 'string' }).notNull(),
  token: text().unique().notNull(),
  createdAt: timestamp({ mode: 'string' }).notNull(),
  updatedAt: timestamp({ mode: 'string' }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})
