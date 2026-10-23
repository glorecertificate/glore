import { index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

import { contentEntityTypeEnum, contentTranslationStatusEnum } from './enums'
import { users } from './users'

export const contentTranslations = pgTable(
  'content_translations',
  {
    entityType: contentEntityTypeEnum().notNull(),
    entityId: integer().notNull(),
    locale: text().notNull(),
    status: contentTranslationStatusEnum().notNull(),
    sourceHash: text().notNull(),
    translatedById: text().references(() => users.id, { onDelete: 'set null' }),
    reviewedById: text().references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp({ mode: 'string', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    primaryKey({ columns: [table.entityType, table.entityId, table.locale] }),
    index('content_translations_locale_status_idx').on(table.locale, table.status),
  ]
)
