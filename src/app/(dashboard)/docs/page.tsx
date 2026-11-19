import { getTranslations } from 'next-intl/server'

import { getDocEditor, loadDocCategories } from '@/actions/docs-core'
import { DocsList } from '@/components/features/docs/docs-list'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { LucideIcon } from '@/components/icons/lucide'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docs',
})

const DocsPageContent = async () => {
  const [canEdit, { data: categories }, t] = await Promise.all([
    getDocEditor(),
    loadDocCategories(),
    getTranslations('Docs'),
  ])
  const allCategories = categories ?? []

  return allCategories.length === 0 ? (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideIcon name="book-open" />
        </EmptyMedia>
        <EmptyTitle>{t('noCategories')}</EmptyTitle>
        <EmptyDescription>
          {canEdit ? t('noCategoriesDescription') : t('noCategoriesDescriptionReader')}
        </EmptyDescription>
      </EmptyHeader>
      {canEdit && (
        <EmptyContent>
          <CategoryManagerTrigger categories={allCategories} />
        </EmptyContent>
      )}
    </Empty>
  ) : (
    <DocsList canEdit={canEdit} categories={allCategories} />
  )
}

const DocsPage = () => (
  <MessagesScope scope="docs">
    <DashboardPage
      className="space-y-8"
      description={<PageTitle namespace="Docs" name="description" />}
      title={<PageTitle namespace="Layout" name="docs" />}
    >
      <DocsPageContent />
    </DashboardPage>
  </MessagesScope>
)

export default DocsPage
