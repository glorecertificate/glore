import { cache } from 'react'

import { type Locale } from 'next-intl'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { getDocEditor, loadDocArticle, loadDocCategories } from '@/actions/docs-core'
import { ArticleActions } from '@/components/features/docs/article-actions'
import { extractHeadings, headingIdsByLine } from '@/components/features/docs/headings'
import { ReadingMarkdown } from '@/components/features/docs/reading-markdown'
import { ReadingToc } from '@/components/features/docs/reading-toc'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Link } from '@/components/ui/link'
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@/components/ui/page-header'
import { Separator } from '@/components/ui/separator'
import { pickLocale } from '@/db/queries/learning'
import { LOCALES } from '@/lib/i18n'

export const loadArticle = cache(async (slug: string) => {
  const found = await loadDocArticle(slug)
  if (!found) return null
  const locale = (await getLocale()) as Locale
  const title = pickLocale(found.article.title, locale) ?? found.article.slug
  const content = pickLocale(found.article.content, locale) ?? ''
  const translated = found.article.content[locale]?.trim()
    ? locale
    : (LOCALES.find(code => found.article.content[code]?.trim()) ?? null)
  return { ...found, content, excerpt: pickLocale(found.article.excerpt, locale), locale, title, translated }
})

export const ArticleView = async ({ slug }: { slug: string }) => {
  const data = await loadArticle(slug)
  if (!data) return null

  const [t, format, canEdit, categories] = await Promise.all([
    getTranslations('Docs'),
    getFormatter(),
    getDocEditor(),
    loadDocCategories(),
  ])
  const { article, category, content, excerpt, locale, siblings, title, translated } = data

  const index = siblings.findIndex(sibling => sibling.slug === article.slug)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]
  const categoryTitle = category ? (pickLocale(category.title, locale) ?? category.slug) : null
  const languageLabel = translated ? new Intl.DisplayNames(locale, { type: 'language' }).of(translated) : null

  const headings = extractHeadings(content)

  return (
    <article className="flex flex-col gap-8">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>{title}</PageHeaderTitle>
          {excerpt && <PageHeaderDescription>{excerpt}</PageHeaderDescription>}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-fg-2">
            {categoryTitle && <span className="type-label text-fg-1">{categoryTitle}</span>}
            <span className="flex items-center gap-1.5">
              <LucideIcon name="calendar" className="size-3 shrink-0" />
              {t('lastUpdated', { date: format.dateTime(new Date(article.updatedAt), { dateStyle: 'long' }) })}
            </span>
            {article.isDraft && (
              <Badge size="sm" variant="muted">
                {t('draft')}
              </Badge>
            )}
          </p>
        </PageHeaderHeading>
        {canEdit && (
          <PageHeaderActions>
            <ArticleActions article={article} categories={categories.data ?? []} />
          </PageHeaderActions>
        )}
      </PageHeader>
      {translated && translated !== locale && (
        <Banner variant="info">
          <LucideIcon name="languages" className="mt-0.5 size-4 shrink-0" />
          <p>{t('article.fallbackLanguage', { language: languageLabel ?? translated })}</p>
        </Banner>
      )}
      <Separator />
      <div className="grid gap-8 lg:grid-cols-4 lg:gap-10">
        <div className="min-w-0 lg:order-last lg:col-span-1">
          <ReadingToc headings={headings} />
        </div>
        <div className="max-w-prose min-w-0 lg:col-span-3">
          {content ? (
            <ReadingMarkdown ids={headingIdsByLine(headings)}>{content}</ReadingMarkdown>
          ) : (
            <p className="text-fg-2">{t('article.noContent')}</p>
          )}
        </div>
      </div>
      {(previous || next) && (
        <nav aria-label={t('article.navigation')} className="grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2">
          {previous ? (
            <Link
              className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-surface-hover focus-visible:focus-ring"
              href={`/docs/articles/${previous.slug}`}
            >
              <LucideIcon name="arrow-left" className="size-4 shrink-0 text-fg-2" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="type-caption text-fg-2">{t('article.previous')}</span>
                <span className="truncate type-label text-fg-1">
                  {pickLocale(previous.title, locale) ?? previous.slug}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              className="flex min-w-0 items-center justify-end gap-3 rounded-lg border bg-card p-4 text-right transition-colors hover:bg-surface-hover focus-visible:focus-ring"
              href={`/docs/articles/${next.slug}`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="type-caption text-fg-2">{t('article.next')}</span>
                <span className="truncate type-label text-fg-1">{pickLocale(next.title, locale) ?? next.slug}</span>
              </span>
              <LucideIcon name="arrow-right" className="size-4 shrink-0 text-fg-2" />
            </Link>
          )}
        </nav>
      )}
    </article>
  )
}
