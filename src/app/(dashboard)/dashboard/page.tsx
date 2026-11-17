import { loadDashboard } from '@/actions/dashboard/load'
import { DashboardContent } from '@/components/features/dashboard'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'dashboard',
})

const DashboardData = async () => <DashboardContent data={await loadDashboard()} />

const DashboardPageContent = () => (
  <MessagesScope scope="home">
    <DashboardPage title={<PageTitle namespace="Layout" name="dashboard" />}>
      <DashboardData />
    </DashboardPage>
  </MessagesScope>
)

export default DashboardPageContent
