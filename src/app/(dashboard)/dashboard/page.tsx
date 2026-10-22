import { loadDashboard } from '@/actions/dashboard/load'
import { DashboardContent } from '@/components/features/dashboard'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'dashboard',
})

const DashboardData = async () => <DashboardContent data={await loadDashboard()} />

const DashboardPageContent = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="dashboard" />}>
    <DashboardData />
  </DashboardPage>
)

export default DashboardPageContent
