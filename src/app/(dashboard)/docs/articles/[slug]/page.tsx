import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getAuthUser } from '@/actions/auth'
import { isEditorUser } from '@/actions/guards'
import { ArticleEditorView } from '@/components/features/docs/article-editor/view'
import { ArticleHeader } from '@/components/features/docs/article-header'
import { ArticleView, loadArticle } from '@/components/features/docs/article-view'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardLoading } from '@/components/layout/dashboard-loading'
import { DashboardPage } from '@/components/layout/dashboard-page'

export const generateMetadata = async ({ params }: PageProps<'/docs/articles/[slug]'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return
  return { description: data.excerpt ?? undefined, title: data.title }
}

const ArticleHeaderLoader = async ({ params }: Pick<PageProps<'/docs/articles/[slug]'>, 'params'>) => {
  const { slug } = await params
  return <ArticleHeader slug={slug} />
}

const ArticlePageContent = async ({ params }: Pick<PageProps<'/docs/articles/[slug]'>, 'params'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return notFound()
  return <ArticleView slug={slug} />
}

const ArticleReaderPage = (props: Pick<PageProps<'/docs/articles/[slug]'>, 'params'>) => (
  <DashboardPage
    overlap
    header={
      <Suspense fallback={<DashboardHeader parent="docs" />}>
        <ArticleHeaderLoader params={props.params} />
      </Suspense>
    }
  >
    <ArticlePageContent {...props} />
  </DashboardPage>
)

const ArticleRoute = async ({ params, searchParams }: PageProps<'/docs/articles/[slug]'>) => {
  const [{ slug }, { view }, user] = await Promise.all([params, searchParams, getAuthUser()])
  if (isEditorUser(user) && view !== 'reader') return <ArticleEditorView slug={slug} />
  return <ArticleReaderPage params={params} />
}

const ArticlePage = (props: PageProps<'/docs/articles/[slug]'>) => (
  <Suspense fallback={<DashboardLoading parent="docs" />}>
    <ArticleRoute {...props} />
  </Suspense>
)

export default ArticlePage
