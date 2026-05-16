import { getTranslations } from 'next-intl/server'

import { DashboardContent } from '@/components/features/dashboard/content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'dashboard',
  })

const DashboardPageContent = async () => {
  const t = await getTranslations('Layout')

  return (
    <DashboardPage title={t('dashboard')}>
      <DashboardContent />
    </DashboardPage>
  )
}

export default DashboardPageContent
