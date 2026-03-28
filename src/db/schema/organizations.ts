import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { membershipRoleEnum, organizationRequestStatusEnum } from './enums'
import { type IntlJsonbNullable } from './helpers'
import { users } from './users'

export const organizations = pgTable('organizations', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  handle: text().notNull().unique(),
  name: text().notNull(),
  email: text().notNull(),
  city: text().notNull(),
  approvedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const organizationProfiles = pgTable(
  'organization_profiles',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: integer()
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    description: jsonb().$type<IntlJsonbNullable>(),
    url: text(),
    phone: text(),
    country: text(),
    region: text(),
    postcode: text(),
    address: text(),
    rating: integer(),
    avatarUrl: text(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('organization_profiles_organization_id_idx').on(table.organizationId)]
)

export const memberships = pgTable(
  'memberships',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
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
  },
  table => [
    index('memberships_user_id_idx').on(table.userId),
    index('memberships_organization_id_idx').on(table.organizationId),
  ]
)

export const organizationJoinRequests = pgTable(
  'organization_join_requests',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: integer()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    firstName: text().notNull(),
    lastName: text(),
    role: membershipRoleEnum().notNull(),
    locale: text(),
    message: text(),
    reviewerComment: text(),
    reviewedBy: text().references(() => users.id),
    status: organizationRequestStatusEnum().notNull().default('pending'),
    acceptedAt: timestamp({ mode: 'string' }),
    rejectedAt: timestamp({ mode: 'string' }),
    reviewedAt: timestamp({ mode: 'string' }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('org_join_requests_organization_id_idx').on(table.organizationId),
    index('org_join_requests_reviewed_by_idx').on(table.reviewedBy),
    index('org_join_requests_status_idx').on(table.status),
  ]
)
