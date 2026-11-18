import { Suspense } from 'react'

import { createSearchParamsCache } from 'nuqs/server'

import { listAdminOrganizationOptions } from '@/actions/admin/options'
import { listAdminUsers } from '@/actions/admin/users'
import { AdminTableSkeleton } from '@/components/features/admin/admin-table-skeleton'
import { AdminUsers } from '@/components/features/admin/users'
import { adminUsersParsers } from '@/components/features/admin/users-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { PageIntro } from '@/components/ui/page-header'
import { generateIntlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(adminUsersParsers)

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.users',
  title: 'title',
})

const AdminUsersContent = async ({ searchParams }: { searchParams: PageProps<'/admin/users'>['searchParams'] }) => {
  const params = await parse(searchParams)
  const [users, organizations] = await Promise.all([
    listAdminUsers({
      banned: params.banned,
      organizationId: params.org,
      page: params.page,
      q: params.q,
      role: params.role,
      status: params.status,
    }),
    listAdminOrganizationOptions(),
  ])
  if (users.error || !users.data) throw new Error(users.error?.message ?? 'Users unavailable')
  return <AdminUsers organizations={organizations.data ?? []} page={users.data} />
}

const AdminUsersPage = ({ searchParams }: PageProps<'/admin/users'>) => (
  <DashboardPage title={<PageTitle namespace="Admin.users" name="title" />}>
    <PageIntro description={<PageTitle namespace="Admin.users" name="description" />}>
      <Suspense
        fallback={
          <AdminTableSkeleton
            columns={['user', 'role', 'status', 'organizations', 'joined']}
            namespace="Admin.users"
            pageSize={20}
            rowActions
          />
        }
      >
        <AdminUsersContent searchParams={searchParams} />
      </Suspense>
    </PageIntro>
  </DashboardPage>
)

export default AdminUsersPage
