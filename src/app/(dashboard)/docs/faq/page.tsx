import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/docs'
import { DocsSection } from '@/components/features/docs/docs-section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsFaq',
})

const DocsFaqContent = async () => {
  const category = await findDocCategory('faq', { includeUnpublished: true })
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

const DocsFaqPage = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="docsFaq" />}>
    <DocsFaqContent />
  </DashboardPage>
)

export default DocsFaqPage
