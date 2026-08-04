import { BookOpenIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { listDocCategories } from '@/actions/docs'
import { DocsList } from '@/components/features/docs/docs-list'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docs',
})

const DocsPageContent = async () => {
  const [user, { data: categories }, t] = await Promise.all([
    getAuthUser(),
    listDocCategories({ includeUnpublished: true }),
    getTranslations('Docs'),
  ])
  const canEdit = user?.role === 'admin' || Boolean(user?.isEditor)
  const allCategories = categories ?? []

  return allCategories.length === 0 ? (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookOpenIcon />
        </EmptyMedia>
        <EmptyTitle>{t('noCategories')}</EmptyTitle>
        <EmptyDescription>{t('noCategoriesDescription')}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <DocsList canEdit={canEdit} categories={allCategories} />
  )
}

const DocsPage = () => (
  <DashboardPage className="space-y-10" title={<PageTitle namespace="Layout" name="docs" />}>
    <DocsPageContent />
  </DashboardPage>
)

export default DocsPage
