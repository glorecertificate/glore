import { type InferSelectModel } from 'drizzle-orm'

import { type docArticles, type docCategories } from '@/db/schema'

export type DocCategory = ReturnType<typeof parseDocCategory>
export type DocArticle = ReturnType<typeof parseDocArticle>

export const parseDocArticle = (article: InferSelectModel<typeof docArticles>) => ({
  ...article,
  isPublished: article.published,
  isDraft: !article.published,
})

export const parseDocCategory = (
  category: InferSelectModel<typeof docCategories> & {
    articles: InferSelectModel<typeof docArticles>[]
  }
) => ({
  ...category,
  articles: category.articles.map(parseDocArticle),
})
