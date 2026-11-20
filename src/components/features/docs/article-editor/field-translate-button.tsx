'use client'

import { useArticle } from '@/components/features/docs/article-editor/context'
import {
  type ArticleField,
  articleSources,
  planArticleTranslation,
} from '@/components/features/docs/article-editor/translation-fields'
import {
  FieldTranslateButton,
  type FieldTranslateButtonProps,
} from '@/components/features/translations/field-translate-button'
import { LOCALES } from '@/lib/i18n'

interface ArticleFieldTranslateButtonProps extends Omit<
  FieldTranslateButtonProps,
  'onApply' | 'plan' | 'sources' | 'target'
> {
  field: ArticleField
}

export const ArticleFieldTranslateButton = ({ field, ...props }: ArticleFieldTranslateButtonProps) => {
  const { applyTranslated, draft, flushContent, getDraft, language } = useArticle()

  return (
    <FieldTranslateButton
      {...props}
      beforeRun={flushContent}
      onApply={applyTranslated}
      plan={source => planArticleTranslation({ draft: getDraft(), fields: [field], source, target: language })}
      sources={articleSources(draft, [field], LOCALES, language)}
      target={language}
    />
  )
}
