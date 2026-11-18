import { notFound } from 'next/navigation'

import { loadTranslations } from '@/actions/translations'
import { Translations } from '@/components/features/translations/translations'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { PageIntro } from '@/components/ui/page-header'
import { generateIntlMetadata } from '@/lib/metadata'

export const maxDuration = 60

export const generateMetadata = generateIntlMetadata({
  namespace: 'Translations',
  title: 'title',
})

const TranslationsPageContent = async () => {
  const result = await loadTranslations()
  if (!('data' in result)) return notFound()

  return <Translations catalogs={result.data.catalogs} overrides={result.data.overrides} />
}

const TranslationsPage = () => (
  <DashboardPage title={<PageTitle namespace="Translations" name="title" />}>
    <PageIntro description={<PageTitle namespace="Translations" name="description" />}>
      <TranslationsPageContent />
    </PageIntro>
  </DashboardPage>
)

export default TranslationsPage
