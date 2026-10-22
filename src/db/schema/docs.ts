import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { type IntlJsonb, type IntlJsonbNullable } from './helpers'

export const docCategories = pgTable(
  'doc_categories',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: jsonb().$type<IntlJsonb>().notNull(),
    description: jsonb().$type<IntlJsonbNullable>(),
    slug: text().notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [uniqueIndex('doc_categories_slug_key').on(table.slug)]
)

export const docArticles = pgTable(
  'doc_articles',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: jsonb().$type<IntlJsonb>().notNull(),
    content: jsonb().$type<IntlJsonb>().notNull(),
    excerpt: jsonb().$type<IntlJsonbNullable>(),
    slug: text().notNull(),
    categoryId: integer().references(() => docCategories.id),
    published: boolean().default(false).notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('doc_articles_category_id_idx').on(table.categoryId),
    uniqueIndex('doc_articles_slug_key').on(table.slug),
  ]
)
