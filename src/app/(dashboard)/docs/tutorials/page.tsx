import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/docs'
import { DocsSection } from '@/components/features/docs/docs-section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
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
  <DashboardPage title={<PageTitle namespace="Layout" name="docsTutorials" />}>
    <DocsTutorialsContent />
  </DashboardPage>
)

export default DocsTutorialsPage
