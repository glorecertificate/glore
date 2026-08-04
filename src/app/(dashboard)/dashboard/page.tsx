import { DashboardContent } from '@/components/features/dashboard'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'dashboard',
})

const DashboardPageContent = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="dashboard" />}>
    <DashboardContent />
  </DashboardPage>
)

export default DashboardPageContent
