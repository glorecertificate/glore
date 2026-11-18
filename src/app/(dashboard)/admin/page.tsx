import { getAdminOverview } from '@/actions/admin/overview'
import { AdminOverview, AdminOverviewSkeleton } from '@/components/features/admin/overview'
import { AdminOverviewError } from '@/components/features/admin/overview-error'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
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
  <DashboardPage
    actions={
      <Button asChild variant="band">
        <Link href="/admin/certificates">
          <PageTitle namespace="Admin.overview" name="reviewAction" />
        </Link>
      </Button>
    }
    description={<PageTitle namespace="Admin.overview" name="description" />}
    fallback={<AdminOverviewSkeleton />}
    title={<PageTitle namespace="Admin.overview" name="title" />}
  >
    <AdminOverviewContent />
  </DashboardPage>
)

export default AdminOverviewPage
