import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/doc'
import { DocsSection } from '@/components/features/docs/docs-section'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docsIntro',
  })

export default async () => {
  const [user, category, { data: allCategories }] = await Promise.all([
    getAuthUser(),
    findDocCategory('intro', { includeUnpublished: true }),
    listDocCategories({ includeUnpublished: true }),
  ])

  if (!category) return <PageMain />

  return (
    <>
      <PageHeader />
      <PageMain>
        <DocsSection
          allCategories={allCategories ?? []}
          canEdit={user?.role === 'admin' || Boolean(user?.isEditor)}
          category={category}
        />
      </PageMain>
    </>
  )
}
