'use client'

import { useArticle } from '@/components/features/docs/article-editor/context'
import { TranslationPopover } from '@/components/features/translations/popover'

export const ArticleTranslation = () => {
  const { article, hasAnyUpdates, language, saveVersion } = useArticle()

  return (
    <TranslationPopover
      disabled={hasAnyUpdates}
      entityId={article?.id ?? null}
      entityType="doc_article"
      locale={language}
      version={saveVersion}
    />
  )
}
