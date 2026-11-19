import { loadDashboard } from '@/actions/dashboard/load'
import { DashboardContent } from '@/components/features/dashboard'
import { DashboardBand } from '@/components/features/dashboard/band'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'dashboard',
})

const DashboardData = async () => <DashboardContent data={await loadDashboard()} />

const DashboardPageContent = () => (
  <MessagesScope scope="home">
    <DashboardPage header={<DashboardBand />} overlap>
      <DashboardData />
    </DashboardPage>
  </MessagesScope>
)

export default DashboardPageContent
