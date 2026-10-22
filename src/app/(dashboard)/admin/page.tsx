import { getAdminOverview } from '@/actions/admin/overview'
import { AdminOverview } from '@/components/features/admin/overview'
import { AdminOverviewError } from '@/components/features/admin/overview-error'
import { AdminOverviewSkeleton } from '@/components/features/admin/overview-skeleton'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.overview',
  title: 'title',
})

const AdminOverviewContent = async () => {
  const { data, error } = await getAdminOverview()
  if (error || !data) return <AdminOverviewError />
  return <AdminOverview overview={data} />
}

const AdminOverviewPage = () => (
  <DashboardPage fallback={<AdminOverviewSkeleton />} title={<PageTitle namespace="Admin.overview" name="title" />}>
    <AdminOverviewContent />
  </DashboardPage>
)

export default AdminOverviewPage
