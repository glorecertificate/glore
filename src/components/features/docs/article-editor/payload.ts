import { type Locale } from 'next-intl'

import { type DocAudience } from '@/db/queries/doc'
import { DEFAULT_LOCALE, type IntlRecord, LOCALES } from '@/lib/i18n'

export interface ArticleDraft {
  audiences: DocAudience[]
  categoryId: number | null
  contents: IntlRecord
  excerpts: IntlRecord
  languages: Locale[]
  slug: string
  titles: IntlRecord
}

export type ArticleSaveErrorCode = 'INCOMPLETE' | 'REQUIRED' | 'SAVE_FAILED'

export class ArticleSaveError extends Error {
  code: ArticleSaveErrorCode

  constructor(code: ArticleSaveErrorCode) {
    super(code)
    this.code = code
  }
}

export const buildArticlePayload = (draft: ArticleDraft, locale: Locale, publish: boolean | null) => {
  const slug = draft.slug.trim()
  if (!(draft.titles[DEFAULT_LOCALE].trim() && slug)) throw new ArticleSaveError('REQUIRED')
  if (publish === true && !(draft.titles[locale].trim() && draft.contents[locale].trim())) {
    throw new ArticleSaveError('INCOMPLETE')
  }
  const languages = LOCALES.filter(item => {
    if (item !== locale || publish === null) return draft.languages.includes(item)
    return publish
  })
  return {
    audiences: draft.audiences,
    categoryId: draft.categoryId ?? undefined,
    content: draft.contents,
    excerpt: draft.excerpts,
    languages,
    published: languages.length > 0,
    slug,
    title: draft.titles,
  }
}
