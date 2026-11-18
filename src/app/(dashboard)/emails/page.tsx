import { notFound } from 'next/navigation'

import { createSearchParamsCache } from 'nuqs/server'

import { loadEmailPreview } from '@/actions/emails/preview'
import { AdminEmails } from '@/components/features/admin/emails'
import { emailPreviewParsers } from '@/components/features/admin/emails-params'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { PageIntro } from '@/components/ui/page-header'
import { generateIntlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(emailPreviewParsers)

export const generateMetadata = generateIntlMetadata({
  namespace: 'AdminEmails',
  title: 'title',
})

const EmailsPageContent = async ({ searchParams }: PageProps<'/emails'>) => {
  const { category, lang, template } = await parse(searchParams)
  const { data } = await loadEmailPreview({ category, locale: lang, template })
  if (!data) return notFound()

  return <AdminEmails html={data.html} subject={data.subject} template={data.name} templates={data.templates} />
}

const EmailsPage = (props: PageProps<'/emails'>) => (
  <DashboardPage title={<PageTitle namespace="AdminEmails" name="title" />}>
    <PageIntro description={<PageTitle namespace="AdminEmails" name="description" />}>
      <EmailsPageContent {...props} />
    </PageIntro>
  </DashboardPage>
)

export default EmailsPage
