import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

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

export const organizationProfiles = pgTable('organization_profiles', {
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
  legalName: text(),
  registryId: text(),
  legalRepresentative: text(),
  signatureUrl: text(),
  contactName: text(),
  contactEmail: text(),
  volunteersPerYear: integer(),
  motivation: text(),
  charterAcceptedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

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
    uniqueIndex('memberships_user_id_organization_id_key').on(table.userId, table.organizationId),
  ]
)

export const organizationInvitations = pgTable(
  'organization_invitations',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: integer()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    role: membershipRoleEnum().notNull(),
    tokenHash: text().notNull().unique('organization_invitations_token_hash_unique'),
    tokenCipher: text(),
    invitedById: text().references(() => users.id, { onDelete: 'set null' }),
    userId: text().references(() => users.id, { onDelete: 'set null' }),
    locale: text(),
    message: text(),
    expiresAt: timestamp({ mode: 'string' }).notNull(),
    acceptedAt: timestamp({ mode: 'string' }),
    declinedAt: timestamp({ mode: 'string' }),
    revokedAt: timestamp({ mode: 'string' }),
    lastSentAt: timestamp({ mode: 'string' }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('org_invitations_organization_id_idx').on(table.organizationId),
    index('org_invitations_user_id_idx').on(table.userId),
    index('org_invitations_invited_by_id_idx').on(table.invitedById),
    uniqueIndex('org_invitations_open_email_key')
      .on(table.organizationId, sql`lower(${table.email})`)
      .where(sql`accepted_at is null and declined_at is null and revoked_at is null`),
  ]
)

export const organizationInviteLinks = pgTable(
  'organization_invite_links',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: integer()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum().notNull(),
    tokenHash: text().notNull().unique('organization_invite_links_token_hash_unique'),
    tokenCipher: text(),
    requiresApproval: boolean().default(false).notNull(),
    maxUses: integer(),
    uses: integer().default(0).notNull(),
    expiresAt: timestamp({ mode: 'string' }),
    revokedAt: timestamp({ mode: 'string' }),
    createdById: text().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('org_invite_links_organization_id_idx').on(table.organizationId),
    index('org_invite_links_created_by_id_idx').on(table.createdById),
    check('org_invite_links_role_check', sql`${table.role} in ('volunteer', 'learner')`),
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
    userId: text().references(() => users.id, { onDelete: 'cascade' }),
    inviteLinkId: integer().references(() => organizationInviteLinks.id, { onDelete: 'set null' }),
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
    index('org_join_requests_user_id_idx').on(table.userId),
    uniqueIndex('org_join_requests_pending_email_key')
      .on(table.organizationId, sql`lower(${table.email})`)
      .where(sql`status = 'pending'`),
  ]
)
