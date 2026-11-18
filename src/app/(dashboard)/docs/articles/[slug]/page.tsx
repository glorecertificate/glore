import { notFound } from 'next/navigation'

import { ArticleView, loadArticle } from '@/components/features/docs/article-view'
import { DashboardPage } from '@/components/layout/dashboard-page'

export const generateMetadata = async ({ params }: PageProps<'/docs/articles/[slug]'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return
  return { description: data.excerpt ?? undefined, title: data.title }
}

const ArticleTitle = async ({ params }: Pick<PageProps<'/docs/articles/[slug]'>, 'params'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  return data?.title ?? null
}

const ArticlePageContent = async ({ params }: PageProps<'/docs/articles/[slug]'>) => {
  const { slug } = await params
  const data = await loadArticle(slug)
  if (!data) return notFound()
  return <ArticleView slug={slug} />
}

const ArticlePage = (props: PageProps<'/docs/articles/[slug]'>) => (
  <DashboardPage parent="docs" title={<ArticleTitle params={props.params} />} width="content">
    <ArticlePageContent {...props} />
  </DashboardPage>
)

export default ArticlePage
