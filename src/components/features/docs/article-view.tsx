import { type Route } from 'next'
import { cache } from 'react'

import { type Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { loadDocArticle } from '@/actions/docs-core'
import { ArticleFeedback } from '@/components/features/docs/article-feedback'
import { extractHeadings, headingIdsByLine } from '@/components/features/docs/headings'
import { ReadingMarkdown } from '@/components/features/docs/reading-markdown'
import { ReadingToc } from '@/components/features/docs/reading-toc'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
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

  const t = await getTranslations('Docs')
  const { content, locale, siblings, article, category, title, translated } = data
  const related = category?.slug === 'faq' ? siblings.filter(item => item.slug !== article.slug).slice(0, 4) : []

  const index = siblings.findIndex(sibling => sibling.slug === article.slug)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]
  const languageLabel = translated ? new Intl.DisplayNames(locale, { type: 'language' }).of(translated) : null

  const headings = extractHeadings(content)

  return (
    <article className="flex flex-col gap-6">
      <Card className="gap-6 p-6 sm:p-8">
        {category && (
          <Link
            className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-action-text hover:underline focus-visible:focus-ring sm:min-h-9"
            href={`/docs/${category.slug}` as Route}
          >
            <LucideIcon className="size-3.5" name="arrow-left" />
            {pickLocale(category.title, locale) ?? category.slug}
          </Link>
        )}
        {translated && translated !== locale && (
          <Banner variant="info">
            <LucideIcon name="languages" className="mt-0.5 size-4 shrink-0" />
            <p>{t('article.fallbackLanguage', { language: languageLabel ?? translated })}</p>
          </Banner>
        )}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,45rem)_minmax(0,1fr)] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-8">
            {content ? (
              <ReadingMarkdown ids={headingIdsByLine(headings)}>{content}</ReadingMarkdown>
            ) : (
              <p className="text-fg-2">{t('article.noContent')}</p>
            )}
            <ArticleFeedback title={title} />
          </div>
          <div className="order-first min-w-0 lg:order-0 lg:col-start-2 lg:row-start-1">
            <ReadingToc headings={headings} />
          </div>
        </div>
      </Card>
      {related.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="type-heading text-fg-title">{t('article.related')}</h2>
          <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle bg-card shadow-card">
            {related.map(item => (
              <li key={item.slug}>
                <Link
                  className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm text-fg-1 transition-colors hover:bg-surface-hover focus-visible:focus-ring-inset"
                  href={`/docs/articles/${item.slug}`}
                >
                  {pickLocale(item.title, locale) ?? item.slug}
                  <LucideIcon className="size-3.5 shrink-0 text-fg-3" name="chevron-right" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {(previous || next) && (
        <nav aria-label={t('article.navigation')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {previous ? (
            <Link
              className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-card p-4 shadow-card transition-colors hover:bg-surface-hover focus-visible:focus-ring"
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
              className="flex min-w-0 items-center justify-end gap-3 rounded-xl border border-border-subtle bg-card p-4 text-right shadow-card transition-colors hover:bg-surface-hover focus-visible:focus-ring"
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
