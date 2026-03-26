import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCookie } from '@/actions/cookies'
import { getOrganizationPanel } from '@/actions/organization-queries'
import { getCurrentUser } from '@/actions/user'
import { OrganizationHeader } from '@/components/features/organization/header'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationTabs } from '@/components/features/organization/tabs'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Organization',
    title: 'title',
  })

const OrganizationPageContent = async () => {
  const { data, error } = await getOrganizationPanel()
  if (error || !data) notFound()

  return (
    <OrganizationTabs>
      <OrganizationHeader isOrgAdmin={data.isOrgAdmin} joinRequestCount={data.pendingJoinRequestsCount} />
      <PageMain className="py-8">
        <OrganizationPanel initialData={data} />
      </PageMain>
    </OrganizationTabs>
  )
}

export default async () => {
  const user = await getCurrentUser()

  if (user.canEdit) {
    redirect('/admin')
  }

  const activeOrgId = await getCookie('org')
  const activeOrganization = user.organizations.find(({ id }) => id === activeOrgId) ?? user.organizations[0] ?? null

  if (!(activeOrganization?.role === 'admin' || activeOrganization?.role === 'representative')) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrganizationPageContent />
    </Suspense>
  )
}
