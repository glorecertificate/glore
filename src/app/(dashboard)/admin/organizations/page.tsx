import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getOrganizations } from '@/actions/admin/organizations'
import { getCurrentUser } from '@/actions/user'
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
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()

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
