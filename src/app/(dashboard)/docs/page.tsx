import { BookOpenIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { listDocCategories } from '@/actions/doc'
import { DocsList } from '@/components/features/docs/docs-list'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { Card, CardContent } from '@/components/ui/card'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
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

  return (
    <>
      {allCategories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <BookOpenIcon className="size-8 text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('noCategories')}</p>
              <p className="text-xs text-muted-foreground">{t('noCategoriesDescription')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DocsList canEdit={canEdit} categories={allCategories} />
      )}
    </>
  )
}

const DocsPage = async () => {
  const t = await getTranslations('Layout')

  return (
    <DashboardPage className="space-y-10" title={t('docs')}>
      <DocsPageContent />
    </DashboardPage>
  )
}

export default DocsPage
