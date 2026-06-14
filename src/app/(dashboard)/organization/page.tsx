import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { getCookie } from '@/actions/cookies'
import { getOrganizationPanel } from '@/actions/organizations/queries'
import { getCurrentUser } from '@/actions/user'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationTabs, OrganizationTabsList } from '@/components/features/organization/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Organization',
  title: 'title',
})

const OrganizationContent = async () => {
  const { data, error } = await getOrganizationPanel()
  if (error || !data) notFound()

  const t = await getTranslations('Organization')

  return (
    <OrganizationTabs>
      <DashboardPage
        title={t('title')}
        className="py-8"
        breadcrumb={
          <OrganizationTabsList isOrgAdmin={data.isOrgAdmin} joinRequestCount={data.pendingJoinRequestsCount} />
        }
      >
        <OrganizationPanel initialData={data} />
      </DashboardPage>
    </OrganizationTabs>
  )
}

const OrganizationPage = async () => {
  const user = await getCurrentUser()
  if (user.canEdit) redirect('/admin')

  const activeOrgId = await getCookie('org')
  const activeOrganization = user.organizations.find(({ id }) => id === activeOrgId) ?? user.organizations[0] ?? null

  if (!(activeOrganization?.role === 'admin' || activeOrganization?.role === 'representative')) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrganizationContent />
    </Suspense>
  )
}

export default OrganizationPage
