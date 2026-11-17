import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'

const DashboardLoading = () => (
  <DashboardPage fallback={null}>
    <LoadingFallback />
  </DashboardPage>
)

export default DashboardLoading
