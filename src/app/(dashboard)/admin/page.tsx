import { loadAdminOverview } from '@/actions/admin/overview-core'
import { AdminOverview, AdminOverviewSkeleton } from '@/components/features/admin/overview'
import { AdminOverviewError } from '@/components/features/admin/overview-error'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.overview',
  title: 'title',
})

const AdminOverviewContent = async () => {
  const result = await loadAdminOverview()
  if (!result?.data) return <AdminOverviewError />
  return <AdminOverview overview={result.data} />
}

const AdminOverviewPage = () => (
  <DashboardPage fallback={<AdminOverviewSkeleton />} title={<PageTitle namespace="Admin.overview" name="title" />}>
    <AdminOverviewContent />
  </DashboardPage>
)

export default AdminOverviewPage
