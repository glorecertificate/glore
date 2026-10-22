import { DocsCategoryView } from '@/components/features/docs/category-view'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsTutorials',
})

const DocsTutorialsPage = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="docsTutorials" />}>
    <DocsCategoryView slug="tutorials" />
  </DashboardPage>
)

export default DocsTutorialsPage
