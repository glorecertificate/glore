import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users'

export const accounts = pgTable(
  'accounts',
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ mode: 'string' }),
    refreshTokenExpiresAt: timestamp({ mode: 'string' }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ mode: 'string' }).notNull(),
    updatedAt: timestamp({ mode: 'string' }).notNull(),
  },
  table => [index('accounts_user_id_idx').on(table.userId)]
)
