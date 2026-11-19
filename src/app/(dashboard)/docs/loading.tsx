import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'

const DocsLoadingPage = () => (
  <DashboardPage fallback={null} title={<PageTitle name="docs" namespace="Layout" />}>
    <LoadingFallback delay={false} />
  </DashboardPage>
)

export default DocsLoadingPage
