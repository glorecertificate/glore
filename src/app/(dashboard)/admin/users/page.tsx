import { Suspense } from 'react'

import { getAdminUsers } from '@/actions/admin'
import { AdminUsers } from '@/components/features/admin/users'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Admin.users',
    title: 'title',
  })

const AdminUsersPage = async () => {
  const { data, error } = await getAdminUsers()
  if (error) throw error
  return <AdminUsers users={data} />
}

export default () => (
  <>
    <PageHeader namespace="Admin.users" titleKey="title" />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <AdminUsersPage />
      </Suspense>
    </PageMain>
  </>
)
