import { type InferSelectModel } from 'drizzle-orm'

import { type docArticles, type docCategories } from '@/db/schema'
import { type IntlRecord, LOCALES } from '@/lib/i18n'

export type DocCategory = ReturnType<typeof parseDocCategory>
export type DocArticle = ReturnType<typeof parseDocArticle>

export const parseDocArticle = (article: InferSelectModel<typeof docArticles>) => ({
  ...article,
  isPublished: isPublicArticle(article),
  isDraft: !isPublicArticle(article),
})

export const parseDocCategory = (
  category: InferSelectModel<typeof docCategories> & {
    articles: InferSelectModel<typeof docArticles>[]
  }
) => ({
  ...category,
  articles: category.articles.map(parseDocArticle),
})

const visibleLocales = (record: IntlRecord | null, languages: readonly string[]) =>
  record
    ? LOCALES.reduce(
        (visible, locale) => ({ ...visible, [locale]: languages.includes(locale) ? (record[locale] ?? '') : '' }),
        {} as IntlRecord
      )
    : null

export const isPublicArticle = (article: Pick<InferSelectModel<typeof docArticles>, 'languages' | 'published'>) =>
  article.published && article.languages.length > 0

export const redactArticle = <
  T extends Pick<InferSelectModel<typeof docArticles>, 'languages' | 'title'> & {
    content?: IntlRecord
    excerpt?: IntlRecord | null
  },
>(
  article: T
): T => ({
  ...article,
  ...(article.content ? { content: visibleLocales(article.content, article.languages) } : {}),
  ...(article.excerpt ? { excerpt: visibleLocales(article.excerpt, article.languages) } : {}),
  title: visibleLocales(article.title, article.languages) as IntlRecord,
})
