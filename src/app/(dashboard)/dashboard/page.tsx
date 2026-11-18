import { loadDashboard } from '@/actions/dashboard/load'
import { DashboardContent } from '@/components/features/dashboard'
import { DashboardBand } from '@/components/features/dashboard/band'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'dashboard',
})

const DashboardData = async () => <DashboardContent data={await loadDashboard()} />

const DashboardPageContent = () => (
  <DashboardPage header={<DashboardBand />}>
    <DashboardData />
  </DashboardPage>
)

export default DashboardPageContent
