'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { RichContentEditor } from '@/components/features/courses/course-editor/content'
import { useArticle } from '@/components/features/docs/article-editor/context'
import { articleValueToMarkdown, markdownToArticleValue } from '@/components/features/docs/article-markdown'

export const ArticleBody = () => {
  const { bodyVersion, contentFlushRef, draft, language, setContent } = useArticle()
  const t = useTranslations('Docs.editor')
  const [initialValue] = useState(() => markdownToArticleValue(draft.contents[language]))

  return (
    <RichContentEditor
      flushRef={contentFlushRef}
      initialValue={initialValue}
      markdownSafe
      onChange={value => setContent(language, articleValueToMarkdown(value))}
      placeholder={t('bodyPlaceholder')}
      readOnly={false}
      version={`${language}-${bodyVersion}`}
    />
  )
}
