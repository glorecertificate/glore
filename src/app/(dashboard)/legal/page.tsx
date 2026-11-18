import { notFound } from 'next/navigation'

import { loadLegalOverview } from '@/actions/legal/overview-core'
import { getViewer } from '@/actions/viewer'
import { LegalManager, LegalTabs, LegalTabsList } from '@/components/features/legal/legal-manager'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'LegalAdmin',
  title: 'title',
})

const LegalPageContent = async () => {
  const user = await getViewer()
  if (!user.canEdit) return notFound()
  const { data, error } = await loadLegalOverview()
  if (error || !data) throw new Error(error?.message ?? 'Legal documents unavailable')

  return <LegalManager canPublish={user.isAdmin} documents={data} />
}

const LegalPage = () => (
  <LegalTabs>
    <DashboardPage
      overlap
      breadcrumb={<LegalTabsList />}
      description={<PageTitle namespace="LegalAdmin" name="description" />}
      title={<PageTitle namespace="LegalAdmin" name="title" />}
    >
      <LegalPageContent />
    </DashboardPage>
  </LegalTabs>
)

export default LegalPage
