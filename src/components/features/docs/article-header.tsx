import { getFormatter, getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { loadArticle } from '@/components/features/docs/article-view'
import { LucideIcon } from '@/components/icons/lucide'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { pickLocale } from '@/db/queries/learning'

export const ArticleHeader = async ({ slug }: { slug: string }) => {
  const data = await loadArticle(slug)
  if (!data) return <DashboardHeader parent="docs" />

  const [t, tEditor, format, user] = await Promise.all([
    getTranslations('Docs'),
    getTranslations('Docs.editor'),
    getFormatter(),
    getAuthUser(),
  ])
  const canEdit = user?.role === 'admin' || Boolean(user?.isEditor)
  const { article, category, excerpt, locale, title } = data
  const categoryTitle = category ? (pickLocale(category.title, locale) ?? category.slug) : null

  return (
    <DashboardHeader
      actions={
        canEdit ? (
          <Button asChild size="sm" variant="band-secondary">
            <Link href={`/docs/articles/${article.slug}`}>
              <LucideIcon name="pencil" className="size-3.5" />
              {tEditor('editArticle')}
            </Link>
          </Button>
        ) : null
      }
      breadcrumb={
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-band-text">
          {categoryTitle && <span className="font-medium text-band-foreground">{categoryTitle}</span>}
          <span className="flex items-center gap-1.5">
            <LucideIcon name="calendar" className="size-3.5 shrink-0" />
            {t('lastUpdated', { date: format.dateTime(new Date(article.updatedAt), { dateStyle: 'long' }) })}
          </span>
          {article.isDraft && (
            <span className="rounded-full bg-band-scrim px-2 py-0.5 text-xs font-medium text-band-foreground">
              {t('draft')}
            </span>
          )}
        </p>
      }
      description={excerpt}
      parent="docs"
      title={title}
    />
  )
}
