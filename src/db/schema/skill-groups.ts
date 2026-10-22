import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { type IntlJsonb, type IntlJsonbNullable } from './helpers'

export const skillGroups = pgTable('skill_groups', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: jsonb().$type<IntlJsonb>().notNull(),
  description: jsonb().$type<IntlJsonbNullable>(),
  icon: text(),
  sortOrder: integer(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
