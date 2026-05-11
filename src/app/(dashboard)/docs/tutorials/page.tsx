import { Suspense } from 'react'

import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/doc'
import { DocsSection } from '@/components/features/docs/docs-section'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docsTutorials',
  })

const DocsTutorialsContent = async () => {
  const category = await findDocCategory('tutorials', { includeUnpublished: true })
  if (!category) return null

  const [user, categories] = await Promise.all([getAuthUser(), listDocCategories({ includeUnpublished: true })])

  return (
    <DocsSection
      allCategories={categories.data ?? []}
      canEdit={user?.role === 'admin' || Boolean(user?.isEditor)}
      category={category}
    />
  )
}

const DocsTutorialsPage = () => (
  <>
    <PageHeader />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <DocsTutorialsContent />
      </Suspense>
    </PageMain>
  </>
)

export default DocsTutorialsPage
