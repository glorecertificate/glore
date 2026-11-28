'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { RichContentEditor } from '@/components/features/courses/course-editor/content'
import { articleValueToMarkdown, markdownToArticleValue } from '@/components/features/docs/article-markdown'

interface LegalBodyProps {
  flushRef: React.RefObject<(() => unknown) | null>
  labelledBy?: string
  markdown: string
  onChange: (markdown: string) => void
  version: string
}

export const LegalBody = ({ flushRef, labelledBy, markdown, onChange, version }: LegalBodyProps) => {
  const t = useTranslations('LegalAdmin')
  const [initialValue] = useState(() => markdownToArticleValue(markdown))

  return (
    <RichContentEditor
      flushRef={flushRef}
      initialValue={initialValue}
      labelledBy={labelledBy}
      markdownSafe
      onChange={value => onChange(articleValueToMarkdown(value))}
      placeholder={t('bodyPlaceholder')}
      readOnly={false}
      version={version}
    />
  )
}
