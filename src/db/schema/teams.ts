import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users'

export const teamInvitations = pgTable('team_invitations', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text()
    .notNull()
    .references(() => users.id),
  token: text().notNull(),
  email: text().notNull(),
  firstName: text().notNull(),
  lastName: text(),
  role: text().notNull(),
  locale: text(),
  invitedBy: text()
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp({ mode: 'string' }).notNull(),
  acceptedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
