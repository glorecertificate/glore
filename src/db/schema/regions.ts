import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { type IntlJsonb } from './helpers'
import { users } from './users'

export const regions = pgTable('regions', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: jsonb().$type<IntlJsonb>().notNull(),
  icon: text(),
  coordinatorId: text().references(() => users.id),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
