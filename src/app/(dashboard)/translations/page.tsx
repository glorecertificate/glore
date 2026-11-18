import { notFound } from 'next/navigation'

import { loadTranslationsData } from '@/actions/translations-core'
import { Translations } from '@/components/features/translations/translations'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const maxDuration = 60

export const generateMetadata = generateIntlMetadata({
  namespace: 'Translations',
  title: 'title',
})

const TranslationsPageContent = async () => {
  const data = await loadTranslationsData()
  if (!data) return notFound()

  return <Translations catalogs={data.catalogs} overrides={data.overrides} />
}

const TranslationsPage = () => (
  <DashboardPage
    overlap
    description={<PageTitle namespace="Translations" name="description" />}
    title={<PageTitle namespace="Translations" name="title" />}
  >
    <TranslationsPageContent />
  </DashboardPage>
)

export default TranslationsPage
