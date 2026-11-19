'use client'

import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { ArticleCard } from '@/components/features/docs/article-card'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'
import { type DocCategory } from '@/db/queries/doc'
import { type IntlRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface DocsSectionProps {
  category: DocCategory
  canEdit: boolean
  showTitle?: boolean
}

export const DocsSection = ({ canEdit, category, showTitle = true }: DocsSectionProps) => {
  const t = useTranslations('Docs')
  const { localize } = useI18n()

  const newArticleHref = `/docs/new?category=${category.id}` as Route

  const title = localize(category.title as IntlRecord)

  return (
    <section className="space-y-4">
      <div
        className={cn(
          'flex items-center gap-3',
          showTitle ? 'justify-between' : 'justify-end',
          !(showTitle || canEdit) && 'hidden'
        )}
      >
        {showTitle && <h2 className="type-heading text-fg-title capitalize">{title}</h2>}
        {canEdit && (
          <Button asChild size="sm" variant="outline">
            <Link href={newArticleHref}>
              <LucideIcon name="plus" className="size-4" />
              {t('editor.newArticle')}
            </Link>
          </Button>
        )}
      </div>

      {category.articles.length === 0 ? (
        <Empty className="border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="file-text" />
            </EmptyMedia>
            <EmptyTitle>{t('empty')}</EmptyTitle>
          </EmptyHeader>
          {canEdit && (
            <EmptyContent>
              <Button asChild size="sm" variant="outline">
                <Link href={newArticleHref}>
                  <LucideIcon name="plus" className="size-4" />
                  {t('editor.newArticle')}
                </Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.articles.map(article => (
            <ArticleCard key={article.id} article={article} className="h-full" />
          ))}
        </div>
      )}
    </section>
  )
}
