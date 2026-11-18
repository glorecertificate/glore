import { notFound } from 'next/navigation'

import { getOrganizations } from '@/actions/admin/organizations'
import { getCurrentUser } from '@/actions/user'
import { AdminDialogProvider } from '@/components/features/admin/dialog-provider'
import { AdminOrganizations } from '@/components/features/admin/organizations'
import { AdminOrganizationsActions } from '@/components/features/admin/organizations-actions'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.organizations',
  title: 'title',
})

const AdminOrganizationsContent = async () => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  const { data, error } = await getOrganizations()
  if (error || !data) throw error
  return <AdminOrganizations orgs={data} />
}

const AdminOrganizationsPage = () => (
  <DashboardPage
    overlap
    actions={<AdminOrganizationsActions />}
    description={<PageTitle namespace="Admin.organizations" name="description" />}
    provider={AdminDialogProvider}
    title={<PageTitle namespace="Admin.organizations" name="title" />}
  >
    <AdminOrganizationsContent />
  </DashboardPage>
)

export default AdminOrganizationsPage
