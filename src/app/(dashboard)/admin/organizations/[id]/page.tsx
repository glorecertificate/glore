import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getAdminOrganization } from '@/actions/admin/organizations'
import { AdminOrganizationDetail } from '@/components/features/admin/organization-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { HeaderBreadcrumb } from '@/components/ui/header'

const AdminOrganizationContent = async ({ params }: { params: PageProps<'/admin/organizations/[id]'>['params'] }) => {
  const { id } = await params
  const organizationId = Number(id)
  if (!organizationId || Number.isNaN(organizationId)) notFound()

  const { data } = await getAdminOrganization(organizationId)
  if (!data) notFound()

  return (
    <DashboardPage
      breadcrumb={
        <HeaderBreadcrumb
          backHref="/admin/organizations"
          title={<PageTitle namespace="Admin.organizations" name="title" />}
        >
          <BreadcrumbSeparator />
          <BreadcrumbItem className="grow">
            <BreadcrumbPage className="font-medium">{data.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </HeaderBreadcrumb>
      }
    >
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
