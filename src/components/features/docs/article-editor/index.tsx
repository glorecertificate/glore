'use client'

import { AskAIProvider } from '@/components/features/courses/course-editor/ask-ai-provider'
import { EditorActions } from '@/components/features/courses/course-editor/editor-actions'
import { ArticleBody } from '@/components/features/docs/article-editor/body'
import { useArticle } from '@/components/features/docs/article-editor/context'
import { ArticleLanguageTabs } from '@/components/features/docs/article-editor/language-tabs'
import { ArticleSettings } from '@/components/features/docs/article-editor/settings'
import { ArticleTranslation } from '@/components/features/docs/article-editor/translation'
import { useNavigationGuard } from '@/hooks/use-navigation-guard'

export const ArticleEditor = () => {
  const { bodyVersion, hasAnyUpdates, language } = useArticle()

  useNavigationGuard(hasAnyUpdates)

  return (
    <AskAIProvider>
      <div className="flex min-w-0 flex-col">
        <ArticleSettings />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <ArticleLanguageTabs />
          <EditorActions>
            <ArticleTranslation />
          </EditorActions>
        </div>
        <ArticleBody key={`${language}-${bodyVersion}`} />
      </div>
    </AskAIProvider>
  )
}
