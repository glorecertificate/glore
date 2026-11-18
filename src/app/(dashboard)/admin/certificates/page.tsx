import { Suspense } from 'react'

import { createSearchParamsCache } from 'nuqs/server'

import { searchAdminCertificates } from '@/actions/admin/certificates'
import { listAdminOrganizationOptions } from '@/actions/admin/options'
import { AdminTableSkeleton } from '@/components/features/admin/admin-table-skeleton'
import { AdminCertificates } from '@/components/features/admin/certificates'
import { adminCertificatesParsers } from '@/components/features/admin/certificates-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { PageIntro } from '@/components/ui/page-header'
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
    <PageIntro description={<PageTitle namespace="Admin.certificates" name="description" />}>
      <Suspense fallback={<AdminTableSkeleton kind="certificates" />}>
        <AdminCertificatesContent searchParams={searchParams} />
      </Suspense>
    </PageIntro>
  </DashboardPage>
)

export default AdminCertificatesPage
