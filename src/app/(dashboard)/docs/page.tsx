import { BookOpenIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { listDocCategories } from '@/actions/doc'
import { DocsSection } from '@/components/features/docs/docs-section'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { Card, CardContent } from '@/components/ui/card'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docs',
  })

export default async () => {
  const [user, { data: categories }, t] = await Promise.all([
    getAuthUser(),
    listDocCategories({ includeUnpublished: true }),
    getTranslations('Docs'),
  ])

  const canEdit = user?.role === 'admin' || Boolean(user?.isEditor)
  const allCategories = categories ?? []

  return (
    <>
      <PageHeader />
      <PageMain className="space-y-10">
        {canEdit && <CategoryManagerTrigger categories={allCategories} />}
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
          allCategories.map(category => (
            <DocsSection key={category.id} allCategories={allCategories} canEdit={canEdit} category={category} />
          ))
        )}
      </PageMain>
    </>
  )
}
