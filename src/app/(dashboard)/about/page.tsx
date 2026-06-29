import { getTranslations } from 'next-intl/server'

import { AboutContent } from '@/components/features/about'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'about',
})

const AboutPage = async () => {
  const t = await getTranslations('Layout')

  return (
    <DashboardPage title={t('about')}>
      <AboutContent />
    </DashboardPage>
  )
}

export default AboutPage
