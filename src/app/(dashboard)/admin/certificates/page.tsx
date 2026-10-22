import { Suspense } from 'react'

import { createSearchParamsCache } from 'nuqs/server'

import { searchAdminCertificates } from '@/actions/admin/certificates'
import { listAdminOrganizationOptions } from '@/actions/admin/options'
import { AdminCertificates } from '@/components/features/admin/certificates'
import { adminCertificatesParsers } from '@/components/features/admin/certificates-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(adminCertificatesParsers)

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.certificates',
  title: 'title',
})

const AdminCertificatesContent = async ({
  searchParams,
}: {
  searchParams: PageProps<'/admin/certificates'>['searchParams']
}) => {
  const params = await parse(searchParams)
  const [organizations, certificates] = await Promise.all([
    listAdminOrganizationOptions(),
    params.org === null
      ? searchAdminCertificates({ page: params.page, q: params.q, status: params.status })
      : Promise.resolve({ data: null, error: null }),
  ])
  if (certificates.error) throw new Error(certificates.error.message)
  return <AdminCertificates organizations={organizations.data ?? []} page={certificates.data} />
}

const AdminCertificatesPage = ({ searchParams }: PageProps<'/admin/certificates'>) => (
  <DashboardPage title={<PageTitle namespace="Admin.certificates" name="title" />}>
    <Suspense fallback={<LoadingFallback />}>
      <AdminCertificatesContent searchParams={searchParams} />
    </Suspense>
  </DashboardPage>
)

export default AdminCertificatesPage
