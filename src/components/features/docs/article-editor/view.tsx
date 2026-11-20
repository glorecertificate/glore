import { notFound } from 'next/navigation'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { listDocCategories } from '@/actions/docs'
import { loadDocArticle } from '@/actions/docs-core'
import { ArticleEditor } from '@/components/features/docs/article-editor'
import { ArticleProvider } from '@/components/features/docs/article-editor/context'
import { ArticleEditorHeader } from '@/components/features/docs/article-editor/header'
import { ArticleEditorTabs } from '@/components/features/docs/article-editor/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'

interface ArticleEditorViewProps {
  defaultCategoryId?: number
  slug?: string
}

export const ArticleEditorView = async ({ defaultCategoryId, slug }: ArticleEditorViewProps) => {
  const [found, categories, language] = await Promise.all([
    slug ? loadDocArticle(slug) : null,
    listDocCategories({ includeUnpublished: true }),
    getLocale(),
  ])
  if (slug && !found) return notFound()

  return (
    <ArticleProvider
      key={found?.article.id ?? 'new'}
      value={{
        article: found?.article,
        categories: categories.data ?? [],
        defaultCategoryId,
        language: language as Locale,
      }}
    >
      <DashboardPage header={<ArticleEditorHeader />} provider={ArticleEditorTabs}>
        <ArticleEditor />
      </DashboardPage>
    </ArticleProvider>
  )
}
