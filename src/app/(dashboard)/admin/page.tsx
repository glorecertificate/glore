import { Suspense } from 'react'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { loadAdminOverview } from '@/actions/admin/overview-core'
import { loadEditorSummary } from '@/actions/dashboard/editor'
import { AdminOverview, AdminOverviewSkeleton } from '@/components/features/admin/overview'
import { AdminOverviewError } from '@/components/features/admin/overview-error'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.overview',
  title: 'title',
})

const AdminOverviewBandContent = async () => {
  const result = await loadAdminOverview()
  const oldest = result?.data?.decisions.oldestApplication
  return (
    <DashboardHeader
      actions={
        <Button asChild variant="band">
          <Link href={oldest ? `/admin/organizations/${oldest.id}` : '/admin/certificates'}>
            <PageTitle name={oldest ? 'reviewNext' : 'reviewAction'} namespace="Admin.overview" />
          </Link>
        </Button>
      }
      description={<PageTitle name="description" namespace="Admin.overview" />}
      title={<PageTitle name="title" namespace="Admin.overview" />}
    />
  )
}

const AdminOverviewBand = () => (
  <Suspense
    fallback={
      <DashboardHeader
        description={<PageTitle name="description" namespace="Admin.overview" />}
        title={<PageTitle name="title" namespace="Admin.overview" />}
      />
    }
  >
    <AdminOverviewBandContent />
  </Suspense>
)

const AdminOverviewContent = async () => {
  const locale = await getLocale()
  const [result, editor] = await Promise.all([loadAdminOverview(), loadEditorSummary(locale as Locale)])
  if (!result?.data) return <AdminOverviewError />
  return <AdminOverview health={editor.health} overview={result.data} />
}

const AdminOverviewPage = () => (
  <DashboardPage fallback={<AdminOverviewSkeleton />} header={<AdminOverviewBand />} overlap>
    <AdminOverviewContent />
  </DashboardPage>
)

export default AdminOverviewPage
