import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getOrganizationPanel } from '@/actions/organizations/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { OrganizationPanel } from '@/components/features/organization/panel'
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
  const [user, activeOrgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (user.isAdmin) redirect('/admin')
  if (user.canEdit) notFound()

  const activeOrganization = user.organizations.find(({ id }) => id === activeOrgId)

  if (!(activeOrganization?.role === 'admin' || activeOrganization?.role === 'representative')) {
    notFound()
  }

  const { data, error } = await getOrganizationPanel()
  if (error || !data) notFound()

  return (
    <OrganizationTabs>
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
        <OrganizationPanel initialData={data} />
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
