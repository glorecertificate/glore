import { notFound } from 'next/navigation'

import { getAdminOrganization, getAdminOrganizationName } from '@/actions/admin/organizations'
import { AdminOrganizationDetail } from '@/components/features/admin/organization-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'

export const generateMetadata = async ({ params }: PageProps<'/admin/organizations/[id]'>) => {
  const organizationId = Number((await params).id)
  if (!organizationId || Number.isNaN(organizationId)) return
  const name = await getAdminOrganizationName(organizationId)
  if (!name) return
  return { title: name }
}

const AdminOrganizationContent = async ({ params }: { params: PageProps<'/admin/organizations/[id]'>['params'] }) => {
  const { id } = await params
  const organizationId = Number(id)
  if (!organizationId || Number.isNaN(organizationId)) notFound()

  const { data } = await getAdminOrganization(organizationId)
  if (!data) notFound()

  return <AdminOrganizationDetail initialData={data} />
}

const AdminOrganizationName = async ({ params }: { params: PageProps<'/admin/organizations/[id]'>['params'] }) =>
  getAdminOrganizationName(Number((await params).id))

const AdminOrganizationPage = (props: PageProps<'/admin/organizations/[id]'>) => (
  <DashboardPage parent="admin-organizations" title={<AdminOrganizationName params={props.params} />}>
    <AdminOrganizationContent {...props} />
  </DashboardPage>
)

export default AdminOrganizationPage
