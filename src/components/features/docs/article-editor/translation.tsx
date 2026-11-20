'use client'

import { useTranslations } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import {
  ARTICLE_FIELDS,
  articleSources,
  planArticleTranslation,
} from '@/components/features/docs/article-editor/translation-fields'
import { TranslateMenu } from '@/components/features/translations/translate-menu'
import { LOCALES } from '@/lib/i18n'

export const ArticleTranslation = () => {
  const t = useTranslations('Docs.editor')
  const { applyTranslated, draft, flushContent, getDraft, language } = useArticle()

  return (
    <TranslateMenu
      beforeRun={flushContent}
      empty={t('translateEmpty')}
      onApply={applyTranslated}
      plan={source => planArticleTranslation({ draft: getDraft(), fields: ARTICLE_FIELDS, source, target: language })}
      sources={articleSources(draft, ARTICLE_FIELDS, LOCALES, language)}
      target={language}
    />
  )
}
