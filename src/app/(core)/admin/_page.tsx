import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'admin',
  })

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <AdminDashboard />
    </PageMain>
  </>
)
