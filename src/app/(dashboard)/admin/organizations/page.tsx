import { notFound } from 'next/navigation'

import { getOrganizations } from '@/actions/admin/organizations'
import { getCurrentUser } from '@/actions/user'
import { AdminOrganizations } from '@/components/features/admin/organizations'
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
  <DashboardPage title={<PageTitle namespace="Admin.organizations" name="title" />}>
    <AdminOrganizationsContent />
  </DashboardPage>
)

export default AdminOrganizationsPage
