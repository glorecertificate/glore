import { Suspense } from 'react'

import { BookOpenIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { listDocCategories } from '@/actions/doc'
import { DocsList } from '@/components/features/docs/docs-list'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { Card, CardContent } from '@/components/ui/card'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docs',
  })

const DocsContent = async () => {
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

export default () => (
  <>
    <PageHeader />
    <PageMain className="space-y-10">
      <Suspense fallback={<LoadingFallback />}>
        <DocsContent />
      </Suspense>
    </PageMain>
  </>
)
