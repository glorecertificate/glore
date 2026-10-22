import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { loadEmailPreview } from '@/actions/emails/preview'
import { AdminEmails } from '@/components/features/admin/emails'
import { emailPreviewParsers } from '@/components/features/admin/emails-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(emailPreviewParsers)

export const generateMetadata = generateIntlMetadata({
  namespace: 'AdminEmails',
  title: 'title',
})

const EmailsPageContent = async ({ searchParams }: PageProps<'/emails'>) => {
  const { category, lang, template } = await parse(searchParams)
  const [t, { data }] = await Promise.all([
    getTranslations('AdminEmails'),
    loadEmailPreview({ category, locale: lang, template }),
  ])
  if (!data) return notFound()

  return (
    <DashboardPage description={t('description')} title={<PageTitle namespace="AdminEmails" name="title" />}>
      <AdminEmails html={data.html} subject={data.subject} template={data.name} templates={data.templates} />
    </DashboardPage>
  )
}

const EmailsPage = (props: PageProps<'/emails'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <EmailsPageContent {...props} />
  </Suspense>
)

export default EmailsPage
