import { notFound, redirect } from 'next/navigation'
import { Suspense, cache } from 'react'

import { loadOrganizationPanel } from '@/actions/organizations/panel-data'
import { getViewerContext } from '@/actions/viewer'
import {
  OrganizationInviteButton,
  OrganizationInviteHost,
  OrganizationInviteRoles,
} from '@/components/features/organization/invite-host'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationPanelRegion } from '@/components/features/organization/panel-region'
import { OrganizationScope, OrganizationTabs, OrganizationTabsList } from '@/components/features/organization/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { Spinner } from '@/components/ui/spinner'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Organization',
  title: 'title',
})

const loadPanel = cache(async () => {
  const { role, user } = await getViewerContext()
  if (user.isAdmin) redirect('/admin')
  if (user.canEdit) notFound()

  if (!(role === 'admin' || role === 'representative')) {
    notFound()
  }

  const { data, error } = await loadOrganizationPanel()
  if (error || !data) notFound()

  return data
})

const OrganizationTabsBar = async () => {
  const data = await loadPanel()

  return (
    <>
      <OrganizationScope organizationId={data.organization.id} userId={data.currentUserId} />
      <OrganizationInviteRoles isOrgAdmin={data.isOrgAdmin} />
      <OrganizationTabsList
        invitationCount={data.pendingInvitationsCount}
        isOrgAdmin={data.isOrgAdmin}
        joinRequestCount={data.pendingJoinRequestsCount}
      />
    </>
  )
}

const OrganizationDescription = async () => {
  const data = await loadPanel()

  return [data.organization.name, data.organization.city].filter(Boolean).join(' · ')
}

const OrganizationContent = async () => (
  <OrganizationPanelRegion>
    <OrganizationPanel initialData={await loadPanel()} />
  </OrganizationPanelRegion>
)

const OrganizationPage = () => (
  <OrganizationTabs>
    <OrganizationInviteHost>
      <DashboardPage
        actions={<OrganizationInviteButton />}
        description={
          <Suspense fallback={null}>
            <OrganizationDescription />
          </Suspense>
        }
        title={<PageTitle namespace="Organization" name="title" />}
        breadcrumb={
          <Suspense fallback={<Spinner size="md" />}>
            <OrganizationTabsBar />
          </Suspense>
        }
      >
        <OrganizationContent />
      </DashboardPage>
    </OrganizationInviteHost>
  </OrganizationTabs>
)

export default OrganizationPage
