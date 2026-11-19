import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ArticleHeader } from '@/components/features/docs/article-header'
import { ArticleView, loadArticle } from '@/components/features/docs/article-view'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { MessagesScope } from '@/components/providers/messages-scope'

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

const ArticlePageContent = async ({ params }: PageProps<'/docs/articles/[slug]'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return notFound()
  return <ArticleView slug={slug} />
}

const ArticlePage = (props: PageProps<'/docs/articles/[slug]'>) => (
  <MessagesScope scope="docs">
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
  </MessagesScope>
)

export default ArticlePage
