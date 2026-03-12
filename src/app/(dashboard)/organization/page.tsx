import { notFound, redirect } from 'next/navigation'

import { getCookie } from '@/actions/cookies'
import { getOrganizationPanel } from '@/actions/organization'
import { getCurrentUser } from '@/actions/user'
import { OrganizationHeader } from '@/components/features/organization/header'
import { OrganizationPanel } from '@/components/features/organization/panel'
import { OrganizationTabs } from '@/components/features/organization/tabs'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Organization',
    title: 'title',
  })

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

  const { data, error } = await getOrganizationPanel()

  if (error || !data) {
    notFound()
  }

  return (
    <OrganizationTabs>
      <OrganizationHeader isOrgAdmin={data.isOrgAdmin} joinRequestCount={data.pendingJoinRequestsCount} />
      <PageMain className="py-8">
        <OrganizationPanel initialData={data} />
      </PageMain>
    </OrganizationTabs>
  )
}
