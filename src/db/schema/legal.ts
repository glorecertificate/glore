import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { legalTranslationStatusEnum, legalVersionStatusEnum } from './enums'
import { timestamps } from './helpers'
import { users } from './users'

export const legalDocuments = pgTable('legal_documents', {
  slug: text().primaryKey(),
  requiresAcceptance: boolean().default(false).notNull(),
  currentVersionId: integer().references((): AnyPgColumn => legalVersions.id, { onDelete: 'set null' }),
  ...timestamps,
})

export const legalVersions = pgTable(
  'legal_versions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    documentSlug: text()
      .notNull()
      .references(() => legalDocuments.slug, { onDelete: 'cascade' }),
    version: integer().notNull(),
    status: legalVersionStatusEnum().default('draft').notNull(),
    material: boolean().default(false).notNull(),
    changeNote: text(),
    effectiveAt: date({ mode: 'string' }),
    publishedAt: timestamp({ mode: 'string' }),
    publishedById: text().references(() => users.id, { onDelete: 'set null' }),
    createdById: text().references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  table => [
    uniqueIndex('legal_versions_document_slug_version_key').on(table.documentSlug, table.version),
    uniqueIndex('legal_versions_one_draft_key')
      .on(table.documentSlug)
      .where(sql`${table.status} = 'draft'`),
    index('legal_versions_published_by_id_idx').on(table.publishedById),
    index('legal_versions_created_by_id_idx').on(table.createdById),
  ]
)

export const legalTranslations = pgTable(
  'legal_translations',
  {
    versionId: integer()
      .notNull()
      .references(() => legalVersions.id, { onDelete: 'cascade' }),
    locale: text().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    status: legalTranslationStatusEnum().default('draft').notNull(),
    sourceHash: text(),
    updatedById: text().references(() => users.id, { onDelete: 'set null' }),
    reviewedById: text().references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    primaryKey({ columns: [table.versionId, table.locale], name: 'legal_translations_pkey' }),
    index('legal_translations_updated_by_id_idx').on(table.updatedById),
    index('legal_translations_reviewed_by_id_idx').on(table.reviewedById),
  ]
)

export const legalAcceptances = pgTable(
  'legal_acceptances',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    versionId: integer()
      .notNull()
      .references(() => legalVersions.id, { onDelete: 'restrict' }),
    locale: text().notNull(),
    acceptedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('legal_acceptances_user_id_version_id_key').on(table.userId, table.versionId),
    index('legal_acceptances_version_id_idx').on(table.versionId),
  ]
)
