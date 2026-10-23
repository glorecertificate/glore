import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { docArticles, docCategories } from '@/db/schema'
import { LOCALES } from '@/lib/i18n'

const intlText = (max: number) => z.record(z.enum(LOCALES), z.string().max(max))

const timestamps = { createdAt: true, updatedAt: true } as const

export const docCategoryInsertSchema = createInsertSchema(docCategories, {
  title: intlText(200),
  description: intlText(1000).nullish(),
  slug: schema => schema.min(1).max(100),
}).omit(timestamps)

export const docArticleInsertSchema = createInsertSchema(docArticles, {
  title: intlText(200),
  content: intlText(200_000),
  excerpt: intlText(1000).nullish(),
  languages: z.array(z.enum(LOCALES)).optional(),
  slug: schema => schema.min(1).max(100),
}).omit(timestamps)

export const docArticleUpdateSchema = createUpdateSchema(docArticles, {
  title: intlText(200).optional(),
  content: intlText(200_000).optional(),
  excerpt: intlText(1000).nullish(),
  languages: z.array(z.enum(LOCALES)).optional(),
  slug: schema => schema.min(1).max(100),
}).omit(timestamps)
