import { sql } from 'drizzle-orm'
import { check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { users } from './users'

export const MESSAGE_ORIGINS = ['human', 'machine', 'import', 'tms'] as const

export const MESSAGE_REVISION_ACTIONS = ['draft', 'publish', 'reset', 'discard'] as const

export const messageOriginEnum = pgEnum('message_origin', MESSAGE_ORIGINS)

export const messageRevisionActionEnum = pgEnum('message_revision_action', MESSAGE_REVISION_ACTIONS)

export const messageOverrides = pgTable(
  'message_overrides',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    locale: text().notNull(),
    key: text().notNull(),
    namespace: text().notNull(),
    value: text(),
    draftValue: text(),
    sourceHash: text().notNull(),
    baseHash: text(),
    origin: messageOriginEnum().notNull().default('human'),
    externalId: text(),
    updatedById: text().references(() => users.id, { onDelete: 'set null' }),
    publishedById: text().references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp({ mode: 'string' }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    uniqueIndex('message_overrides_locale_key_key').on(table.locale, table.key),
    index('message_overrides_locale_namespace_idx').on(table.locale, table.namespace),
    index('message_overrides_pending_idx')
      .on(table.locale, table.namespace)
      .where(sql`${table.draftValue} is not null`),
    check('message_overrides_has_text_check', sql`${table.value} is not null or ${table.draftValue} is not null`),
  ]
)

export const messageOverrideRevisions = pgTable(
  'message_override_revisions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    locale: text().notNull(),
    key: text().notNull(),
    value: text(),
    action: messageRevisionActionEnum().notNull(),
    actorId: text().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  },
  table => [index('message_override_revisions_key_idx').on(table.locale, table.key, table.createdAt)]
)
