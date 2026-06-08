import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { getAdminOrganization } from '@/actions/admin/organizations'
import { AdminOrganizationDetail } from '@/components/features/admin/organization-detail'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { HeaderBreadcrumb } from '@/components/ui/header'

const AdminOrganizationPage = async ({ params }: PageProps<'/admin/organizations/[id]'>) => {
  const { id } = await params
  const organizationId = Number(id)
  if (!organizationId || Number.isNaN(organizationId)) notFound()

  const { data } = await getAdminOrganization(organizationId)
  if (!data) notFound()

  const t = await getTranslations('Admin.organizations')

  return (
    <DashboardPage
      breadcrumb={
        <HeaderBreadcrumb backHref="/admin/organizations" title={t('title')}>
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

export default AdminOrganizationPage
