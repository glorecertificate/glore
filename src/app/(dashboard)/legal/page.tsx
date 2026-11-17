import { notFound } from 'next/navigation'

import { getLegalOverview } from '@/actions/legal/manage'
import { getCurrentUser } from '@/actions/user'
import { LegalManager } from '@/components/features/legal/legal-manager'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'LegalAdmin',
  title: 'title',
})

const LegalPageContent = async () => {
  const user = await getCurrentUser()
  if (!user.canEdit) return notFound()
  const { data, error } = await getLegalOverview()
  if (error || !data) throw new Error(error?.message ?? 'Legal documents unavailable')

  return <LegalManager canPublish={user.isAdmin} documents={data} />
}

const LegalPage = () => (
  <DashboardPage
    description={<PageTitle namespace="LegalAdmin" name="description" />}
    title={<PageTitle namespace="LegalAdmin" name="title" />}
  >
    <LegalPageContent />
  </DashboardPage>
)

export default LegalPage
