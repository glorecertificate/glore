import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { membershipRoleEnum } from './enums'
import { type IntlJsonbNullable } from './helpers'
import { users } from './users'

export const organizations = pgTable('organizations', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  handle: text().notNull().unique(),
  name: text().notNull(),
  email: text().notNull(),
  description: jsonb().$type<IntlJsonbNullable>(),
  url: text(),
  phone: text(),
  country: text(),
  region: text(),
  postcode: text(),
  city: text().notNull(),
  address: text(),
  rating: integer(),
  avatarUrl: text(),
  approvedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const memberships = pgTable('memberships', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  role: membershipRoleEnum().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
