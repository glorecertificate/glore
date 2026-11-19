import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getAuthUser } from '@/actions/auth'
import { isEditorUser } from '@/actions/guards'
import { ArticleEditorView } from '@/components/features/docs/article-editor/view'
import { DashboardLoading } from '@/components/layout/dashboard-loading'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Docs.editor',
  title: 'newArticle',
})

const NewArticleRoute = async ({ searchParams }: PageProps<'/docs/new'>) => {
  const [{ category }, user] = await Promise.all([searchParams, getAuthUser()])
  if (!isEditorUser(user)) return notFound()
  const categoryId = Number(Array.isArray(category) ? category[0] : category)
  return (
    <ArticleEditorView defaultCategoryId={Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined} />
  )
}

const NewArticlePage = (props: PageProps<'/docs/new'>) => (
  <Suspense fallback={<DashboardLoading parent="docs" />}>
    <NewArticleRoute {...props} />
  </Suspense>
)

export default NewArticlePage
