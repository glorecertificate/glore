import { type InferSelectModel } from 'drizzle-orm'

import { type docArticles, type docCategories } from '@/db/schema'

type DocCategoryRow = InferSelectModel<typeof docCategories>
type DocArticleRow = InferSelectModel<typeof docArticles>

export interface DocCategoryWithArticles extends DocCategoryRow {
  articles: DocArticleRow[]
}

export type DocCategory = ReturnType<typeof parseDocCategory>
export type DocArticle = ReturnType<typeof parseDocArticle>

export const parseDocArticle = (article: DocArticleRow) => ({
  ...article,
  isPublished: article.published,
  isDraft: !article.published,
})

export const parseDocCategory = (category: DocCategoryWithArticles) => ({
  ...category,
  articles: category.articles.map(parseDocArticle),
})
