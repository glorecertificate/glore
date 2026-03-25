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

const TutorialsContent = async () => {
  const [user, category, { data: allCategories }] = await Promise.all([
    getAuthUser(),
    findDocCategory('tutorials', { includeUnpublished: true }),
    listDocCategories({ includeUnpublished: true }),
  ])

  if (!category) return null

  return (
    <DocsSection
      allCategories={allCategories ?? []}
      canEdit={user?.role === 'admin' || Boolean(user?.isEditor)}
      category={category}
    />
  )
}

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <TutorialsContent />
      </Suspense>
    </PageMain>
  </>
)
