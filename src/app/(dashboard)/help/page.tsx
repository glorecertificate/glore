import { getTranslations } from 'next-intl/server'

import { HelpContent } from '@/components/features/help/content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'help',
  })

const HelpPage = async () => {
  const t = await getTranslations('Layout')

  return (
    <DashboardPage title={t('help')}>
      <HelpContent />
    </DashboardPage>
  )
}

export default HelpPage
