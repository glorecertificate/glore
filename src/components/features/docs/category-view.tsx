import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/docs'
import { DocsSection } from '@/components/features/docs/docs-section'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'

export const DocsCategoryView = async ({ slug }: { slug: string }) => {
  const [category, user, categories, t] = await Promise.all([
    findDocCategory(slug, { includeUnpublished: true }),
    getAuthUser(),
    listDocCategories({ includeUnpublished: true }),
    getTranslations('Docs.missing'),
  ])
  const canEdit = user?.role === 'admin' || Boolean(user?.isEditor)

  if (!category) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideIcon name="book-open" />
          </EmptyMedia>
          <EmptyTitle>{t('title')}</EmptyTitle>
          <EmptyDescription>{canEdit ? t('descriptionEditor', { slug }) : t('description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild size="sm" variant="outline">
            <Link href="/docs">{canEdit ? t('manage') : t('back')}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return <DocsSection allCategories={categories.data ?? []} canEdit={canEdit} category={category} />
}
