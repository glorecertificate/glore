import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getOrganizationPanel } from '@/actions/organizations/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationTabs, OrganizationTabsList } from '@/components/features/organization/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
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
        className="py-8"
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
  <Suspense fallback={<LoadingFallback size="full" />}>
    <OrganizationContent />
  </Suspense>
)

export default OrganizationPage
