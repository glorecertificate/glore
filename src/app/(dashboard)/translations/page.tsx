import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { loadTranslations } from '@/actions/translations'
import { Translations } from '@/components/features/translations/translations'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const maxDuration = 60

export const generateMetadata = generateIntlMetadata({
  namespace: 'Translations',
  title: 'title',
})

const TranslationsPageContent = async () => {
  const [t, result] = await Promise.all([getTranslations('Translations'), loadTranslations()])
  if (!('data' in result)) return notFound()

  return (
    <DashboardPage description={t('description')} title={<PageTitle namespace="Translations" name="title" />}>
      <Translations catalogs={result.data.catalogs} overrides={result.data.overrides} />
    </DashboardPage>
  )
}

const TranslationsPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <TranslationsPageContent />
  </Suspense>
)

export default TranslationsPage
