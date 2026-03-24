import { Suspense } from 'react'

import { getOrganizations } from '@/actions/admin'
import { AdminOrganizations } from '@/components/features/admin/organizations'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Admin.organizations',
    title: 'title',
  })

const AdminOrganizationsPage = async () => {
  const { data, error } = await getOrganizations()
  if (error || !data) throw error ?? new Error('Failed to load organizations')
  return <AdminOrganizations orgs={data} />
}

export default () => (
  <>
    <PageHeader namespace="Admin.organizations" titleKey="title" />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <AdminOrganizationsPage />
      </Suspense>
    </PageMain>
  </>
)
