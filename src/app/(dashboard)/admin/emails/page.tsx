import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { getCurrentUser } from '@/actions/user'
import { AdminEmails } from '@/components/features/admin/emails'
import { emailPreviewParsers } from '@/components/features/admin/emails-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageTitle } from '@/components/layout/page-title'
import { EMAIL_TEMPLATE_NAMES, previewTemplate, renderEmail } from '@/lib/email'
import { generateIntlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(emailPreviewParsers)

export const generateMetadata = generateIntlMetadata({
  namespace: 'AdminEmails',
  title: 'title',
})

const renderPreview = async (options: Parameters<typeof renderEmail>[0]) => {
  try {
    const { html, subject } = await renderEmail(options)
    return { html, subject }
  } catch (error) {
    console.error(`[emails] preview of ${options.template.name} failed`, error)
    return { html: null, subject: null }
  }
}

const EmailsPageContent = async ({ searchParams }: PageProps<'/admin/emails'>) => {
  const [user, { category, lang, template }] = await Promise.all([getCurrentUser(), parse(searchParams)])
  if (!(user.isAdmin || user.canEdit)) return notFound()

  const name = EMAIL_TEMPLATE_NAMES.find(candidate => candidate === template) ?? EMAIL_TEMPLATE_NAMES[0]
  if (!name) return notFound()

  const [t, { html, subject }] = await Promise.all([
    getTranslations('AdminEmails'),
    renderPreview({ category, locale: lang, template: previewTemplate(name) }),
  ])

  return (
    <DashboardPage description={t('description')} title={<PageTitle namespace="AdminEmails" name="title" />}>
      <AdminEmails html={html} subject={subject} template={name} templates={EMAIL_TEMPLATE_NAMES} />
    </DashboardPage>
  )
}

const EmailsPage = (props: PageProps<'/admin/emails'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <EmailsPageContent {...props} />
  </Suspense>
)

export default EmailsPage
