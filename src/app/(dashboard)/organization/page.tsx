import { notFound, redirect } from 'next/navigation'
import { Suspense, cache } from 'react'

import { getOrganizationPanel } from '@/actions/organizations/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationTabs, OrganizationTabsList } from '@/components/features/organization/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { Spinner } from '@/components/ui/spinner'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Organization',
  title: 'title',
})

const loadPanel = cache(async () => {
  const [user, activeOrgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (user.isAdmin) redirect('/admin')
  if (user.canEdit) notFound()

  const activeOrganization = user.organizations.find(({ id }) => id === activeOrgId)

  if (!(activeOrganization?.role === 'admin' || activeOrganization?.role === 'representative')) {
    notFound()
  }

  const { data, error } = await getOrganizationPanel()
  if (error || !data) notFound()

  return data
})

const OrganizationTabsBar = async () => {
  const data = await loadPanel()

  return (
    <OrganizationTabsList
      invitationCount={data.pendingInvitationsCount}
      isOrgAdmin={data.isOrgAdmin}
      joinRequestCount={data.pendingJoinRequestsCount}
    />
  )
}

const OrganizationContent = async () => <OrganizationPanel initialData={await loadPanel()} />

const OrganizationPage = () => (
  <OrganizationTabs>
    <DashboardPage
      title={<PageTitle namespace="Organization" name="title" />}
      breadcrumb={
        <Suspense fallback={<Spinner size="md" />}>
          <OrganizationTabsBar />
        </Suspense>
      }
    >
      <OrganizationContent />
    </DashboardPage>
  </OrganizationTabs>
)

export default OrganizationPage
