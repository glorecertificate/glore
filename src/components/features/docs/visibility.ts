import { type DocAudience, type DocCategory } from '@/db/queries/doc'

interface ListedArticle {
  audiences: string[]
}

export const isListedArticle = (article: ListedArticle, role: DocAudience) =>
  role === 'team' || article.audiences.length === 0 || article.audiences.includes(role)

export const listedCategories = (categories: DocCategory[], role: DocAudience) =>
  categories.map(category => ({
    ...category,
    articles: category.articles.filter(article => isListedArticle(article, role)),
  }))
