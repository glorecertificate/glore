import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getAdminOrganization, getAdminOrganizationName } from '@/actions/admin/organizations'
import { AdminOrganizationDetail } from '@/components/features/admin/organization-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'

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

  return (
    <DashboardPage parent="admin-organizations" title={data.name}>
      <AdminOrganizationDetail initialData={data} />
    </DashboardPage>
  )
}

const AdminOrganizationPage = (props: PageProps<'/admin/organizations/[id]'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <AdminOrganizationContent {...props} />
  </Suspense>
)

export default AdminOrganizationPage
