import { Suspense } from 'react'

import { createSearchParamsCache } from 'nuqs/server'

import { listAdminAudit } from '@/actions/admin/audit'
import { AdminAudit } from '@/components/features/admin/audit'
import { adminAuditParsers } from '@/components/features/admin/audit-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(adminAuditParsers)

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.audit',
  title: 'title',
})

const AdminAuditContent = async ({ searchParams }: { searchParams: PageProps<'/admin/audit'>['searchParams'] }) => {
  const params = await parse(searchParams)
  const { data, error } = await listAdminAudit(params)
  if (error || !data) throw new Error(error?.message ?? 'Audit log unavailable')
  return <AdminAudit page={data} />
}

const AdminAuditPage = ({ searchParams }: PageProps<'/admin/audit'>) => (
  <DashboardPage title={<PageTitle namespace="Admin.audit" name="title" />}>
    <Suspense fallback={<LoadingFallback />}>
      <AdminAuditContent searchParams={searchParams} />
    </Suspense>
  </DashboardPage>
)

export default AdminAuditPage
