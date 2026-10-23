import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users'

export const appSettings = pgTable(
  'app_settings',
  {
    key: text().primaryKey(),
    value: jsonb().$type<unknown>().notNull(),
    updatedById: text().references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('app_settings_updated_by_id_idx').on(table.updatedById)]
)
