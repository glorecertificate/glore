import { DocsCategoryView } from '@/components/features/docs/category-view'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsIntro',
})

const DocsIntroPage = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="docsIntro" />}>
    <DocsCategoryView slug="intro" />
  </DashboardPage>
)

export default DocsIntroPage
