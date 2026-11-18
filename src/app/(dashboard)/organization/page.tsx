import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { loadOrganizationPanel } from '@/actions/organizations/panel-data'
import { getViewerContext } from '@/actions/viewer'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationPanelRegion } from '@/components/features/organization/panel-region'
import { OrganizationTabs, OrganizationTabsList } from '@/components/features/organization/tabs'
import { DashboardLoading } from '@/components/layout/dashboard-loading'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Organization',
  title: 'title',
})

const OrganizationContent = async () => {
  const { role, user } = await getViewerContext()
  if (user.isAdmin) redirect('/admin')
  if (user.canEdit) notFound()

  if (!(role === 'admin' || role === 'representative')) {
    notFound()
  }

  const { data, error } = await loadOrganizationPanel()
  if (error || !data) notFound()

  return (
    <OrganizationTabs organizationId={data.organization.id} userId={data.currentUserId}>
      <DashboardPage
        title={<PageTitle namespace="Organization" name="title" />}
        breadcrumb={
          <OrganizationTabsList
            invitationCount={data.pendingInvitationsCount}
            isOrgAdmin={data.isOrgAdmin}
            joinRequestCount={data.pendingJoinRequestsCount}
          />
        }
      >
        <OrganizationPanelRegion>
          <OrganizationPanel initialData={data} />
        </OrganizationPanelRegion>
      </DashboardPage>
    </OrganizationTabs>
  )
}

const OrganizationPage = () => (
  <Suspense fallback={<DashboardLoading />}>
    <OrganizationContent />
  </Suspense>
)

export default OrganizationPage
