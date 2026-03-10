import { integer, jsonb, pgTable, timestamp } from 'drizzle-orm/pg-core'

import { type IntlJsonb } from './helpers'

export const skillGroups = pgTable('skill_groups', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: jsonb().$type<IntlJsonb>().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
