import { getAuthUser } from '@/actions/auth'
import { listDocCategories } from '@/actions/doc'
import { DocsSection } from '@/components/features/docs/docs-section'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docs',
  })

export default async () => {
  const [user, { data: categories }] = await Promise.all([
    getAuthUser(),
    listDocCategories({ includeUnpublished: true }),
  ])

  const canEdit = user?.role === 'admin' || Boolean(user?.isEditor)
  const allCategories = categories ?? []

  return (
    <>
      <PageHeader />
      <PageMain className="space-y-10">
        {canEdit && <CategoryManagerTrigger categories={allCategories} />}
        {allCategories.map(category => (
          <DocsSection key={category.id} allCategories={allCategories} canEdit={canEdit} category={category} />
        ))}
      </PageMain>
    </>
  )
}
