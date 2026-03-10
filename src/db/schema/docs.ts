import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { type IntlJsonb, type IntlJsonbNullable } from './helpers'

export const docCategories = pgTable('doc_categories', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: jsonb().$type<IntlJsonb>().notNull(),
  description: jsonb().$type<IntlJsonbNullable>(),
  slug: text().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const docArticles = pgTable('doc_articles', {
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
})
