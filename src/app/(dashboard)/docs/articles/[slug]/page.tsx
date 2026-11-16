import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ArticleView, loadArticle } from '@/components/features/docs/article-view'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { MessagesScope } from '@/components/providers/messages-scope'

export const generateMetadata = async ({ params }: PageProps<'/docs/articles/[slug]'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return
  return { description: data.excerpt ?? undefined, title: data.title }
}

const ArticlePageContent = async ({ params }: PageProps<'/docs/articles/[slug]'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return notFound()
  return (
    <DashboardPage backHref="/docs" title={data.title}>
      <ArticleView slug={slug} />
    </DashboardPage>
  )
}

const ArticlePage = (props: PageProps<'/docs/articles/[slug]'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <MessagesScope scope="docs">
      <ArticlePageContent {...props} />
    </MessagesScope>
  </Suspense>
)

export default ArticlePage
