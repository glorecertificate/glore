import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const verifications = pgTable('verifications', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ mode: 'string' }).notNull(),
  createdAt: timestamp({ mode: 'string' }),
  updatedAt: timestamp({ mode: 'string' }),
})
