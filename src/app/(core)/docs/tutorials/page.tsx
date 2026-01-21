import { getTranslations } from 'next-intl/server'

import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docsTutorials',
  })

export default async () => {
  const t = await getTranslations('Common')

  return (
    <>
      <PageHeader />
      <PageMain>
        <h1 className="text-muted-foreground">{t('comingSoonPage')}</h1>
      </PageMain>
    </>
  )
}
