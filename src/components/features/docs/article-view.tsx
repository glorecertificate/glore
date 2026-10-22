import { cache } from 'react'

import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, LanguagesIcon } from 'lucide-react'
import { type Locale } from 'next-intl'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { findDocArticle, listDocCategories } from '@/actions/docs'
import { ArticleActions } from '@/components/features/docs/article-actions'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Link } from '@/components/ui/link'
import { Markdown } from '@/components/ui/markdown'
import { Separator } from '@/components/ui/separator'
import { pickLocale } from '@/db/queries/learning'
import { LOCALES } from '@/lib/i18n'

export const loadArticle = cache(async (slug: string) => {
  const found = await findDocArticle(slug)
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

  const [t, format, user, categories] = await Promise.all([
    getTranslations('Docs'),
    getFormatter(),
    getAuthUser(),
    listDocCategories({ includeUnpublished: true }),
  ])
  const canEdit = user?.role === 'admin' || Boolean(user?.isEditor)
  const { article, category, content, excerpt, locale, siblings, title, translated } = data

  const index = siblings.findIndex(sibling => sibling.slug === article.slug)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]
  const categoryTitle = category ? (pickLocale(category.title, locale) ?? category.slug) : null
  const languageLabel = translated ? new Intl.DisplayNames(locale, { type: 'language' }).of(translated) : null

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-2 pb-12">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/docs">
            {t('title')}
          </Link>
          {categoryTitle && (
            <>
              <span aria-hidden>{'/'}</span>
              <span>{categoryTitle}</span>
            </>
          )}
          {article.isDraft && (
            <Badge size="sm" variant="muted">
              {t('draft')}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold text-balance">{title}</h1>
          {canEdit && <ArticleActions article={article} categories={categories.data ?? []} />}
        </div>
        {excerpt && <p className="text-lg text-muted-foreground">{excerpt}</p>}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="size-3 shrink-0" />
          {t('lastUpdated', { date: format.dateTime(new Date(article.updatedAt), { dateStyle: 'long' }) })}
        </p>
      </header>
      {translated && translated !== locale && (
        <Banner variant="info">
          <LanguagesIcon className="mt-0.5 size-4 shrink-0" />
          <p>{t('article.fallbackLanguage', { language: languageLabel ?? translated })}</p>
        </Banner>
      )}
      <Separator />
      {content ? (
        <Markdown className="text-foreground">{content}</Markdown>
      ) : (
        <p className="text-muted-foreground">{t('article.noContent')}</p>
      )}
      {(previous || next) && (
        <nav aria-label={t('article.navigation')} className="grid gap-3 border-t pt-6 sm:grid-cols-2">
          {previous ? (
            <Link
              className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
              href={`/docs/articles/${previous.slug}`}
            >
              <ArrowLeftIcon className="size-4 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground">{t('article.previous')}</span>
                <span className="truncate font-medium">{pickLocale(previous.title, locale) ?? previous.slug}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              className="flex items-center justify-end gap-2 rounded-lg border p-3 text-right text-sm transition-colors hover:bg-muted/50"
              href={`/docs/articles/${next.slug}`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground">{t('article.next')}</span>
                <span className="truncate font-medium">{pickLocale(next.title, locale) ?? next.slug}</span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0" />
            </Link>
          )}
        </nav>
      )}
    </article>
  )
}
