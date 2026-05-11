import { DashboardContent } from '@/components/features/dashboard/content'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'dashboard',
  })

const DashboardPage = () => (
  <>
    <PageHeader namespace="Layout" titleKey="dashboard" />
    <PageMain>
      <DashboardContent />
    </PageMain>
  </>
)

export default DashboardPage
