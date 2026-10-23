import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { getSettings } from '@/actions/admin/settings'
import { AdminSettingsForm } from '@/components/features/admin/settings-form'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.settings',
  title: 'title',
})

const AdminSettingsContent = async () => {
  const [t, { data, error }] = await Promise.all([getTranslations('Admin.settings'), getSettings()])
  if (error || !data) throw new Error(error?.message ?? 'Settings unavailable')

  return (
    <DashboardPage description={t('description')} title={<PageTitle namespace="Admin.settings" name="title" />}>
      <AdminSettingsForm settings={data} />
    </DashboardPage>
  )
}

const AdminSettingsPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <AdminSettingsContent />
  </Suspense>
)

export default AdminSettingsPage
