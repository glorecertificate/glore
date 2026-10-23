import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { getLegalOverview } from '@/actions/legal/manage'
import { getCurrentUser } from '@/actions/user'
import { LegalManager } from '@/components/features/legal/legal-manager'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'LegalAdmin',
  title: 'title',
})

const LegalPageContent = async () => {
  const [t, user] = await Promise.all([getTranslations('LegalAdmin'), getCurrentUser()])
  if (!user.canEdit) return notFound()
  const { data, error } = await getLegalOverview()
  if (error || !data) throw new Error(error?.message ?? 'Legal documents unavailable')

  return (
    <DashboardPage description={t('description')} title={<PageTitle namespace="LegalAdmin" name="title" />}>
      <LegalManager canPublish={user.isAdmin} documents={data} />
    </DashboardPage>
  )
}

const LegalPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <LegalPageContent />
  </Suspense>
)

export default LegalPage
