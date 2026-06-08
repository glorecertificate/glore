import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { docArticles, docCategories } from '@/db/schema'

const intlText = z.record(z.string(), z.string())

export const docCategoryInsertSchema = createInsertSchema(docCategories, {
  title: intlText,
  description: intlText.nullish(),
  slug: schema => schema.min(1),
})

export const docArticleInsertSchema = createInsertSchema(docArticles, {
  title: intlText,
  content: intlText,
  excerpt: intlText.nullish(),
  slug: schema => schema.min(1),
})

export const docArticleUpdateSchema = createUpdateSchema(docArticles, {
  title: intlText.optional(),
  content: intlText.optional(),
  excerpt: intlText.nullish(),
  slug: schema => schema.min(1),
})
