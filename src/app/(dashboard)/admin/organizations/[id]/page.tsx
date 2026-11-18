import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getAdminOrganization, getAdminOrganizationName } from '@/actions/admin/organizations'
import { AdminOrganizationBandActions, AdminOrganizationBandMeta } from '@/components/features/admin/organization-band'
import {
  AdminOrganizationDetail,
  AdminOrganizationTabs,
  AdminOrganizationTabsList,
} from '@/components/features/admin/organization-detail'
import { organizationState } from '@/components/features/admin/utils'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { SkeletonText } from '@/components/ui/skeleton'

export const generateMetadata = async ({ params }: PageProps<'/admin/organizations/[id]'>) => {
  const organizationId = Number((await params).id)
  if (!organizationId || Number.isNaN(organizationId)) return
  const name = await getAdminOrganizationName(organizationId)
  if (!name) return
  return { title: name }
}

const AdminOrganizationLoaded = async ({ params }: { params: PageProps<'/admin/organizations/[id]'>['params'] }) => {
  const { id } = await params
  const organizationId = Number(id)
  if (!organizationId || Number.isNaN(organizationId)) notFound()

  const { data } = await getAdminOrganization(organizationId)
  if (!data) notFound()

  const state = organizationState(data)
  const status = state.isApproved ? 'active' : state.isRejected ? 'rejected' : 'pending'

  return (
    <AdminOrganizationTabs approved={state.isApproved} hasApplication={state.hasApplication}>
      <DashboardPage
        header={
          <DashboardHeader
            actions={state.isPending && <AdminOrganizationBandActions id={data.id} name={data.name} />}
            breadcrumb={
              <AdminOrganizationTabsList
                hasApplication={state.hasApplication}
                members={state.members}
                pendingInvitations={state.pendingInvitations}
              />
            }
            description={
              <AdminOrganizationBandMeta
                organization={{
                  city: data.city,
                  country: data.country,
                  createdAt: data.createdAt,
                  email: data.email,
                  memberCount: state.members,
                  url: data.url,
                }}
                status={status}
              />
            }
            parent="admin-organizations"
            title={data.name}
          />
        }
      >
        <AdminOrganizationDetail initialData={data} />
      </DashboardPage>
    </AdminOrganizationTabs>
  )
}

const AdminOrganizationPage = (props: PageProps<'/admin/organizations/[id]'>) => (
  <Suspense
    fallback={
      <DashboardPage
        fallback={null}
        parent="admin-organizations"
        title={
          <SkeletonText className="bg-band-scrim">
            <PageTitle name="title" namespace="Admin.organizations" />
          </SkeletonText>
        }
      >
        <LoadingFallback />
      </DashboardPage>
    }
  >
    <AdminOrganizationLoaded params={props.params} />
  </Suspense>
)

export default AdminOrganizationPage
