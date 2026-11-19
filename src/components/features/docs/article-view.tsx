import { type Route } from 'next'
import { cache } from 'react'

import { type Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { loadDocArticle } from '@/actions/docs-core'
import { ArticleFeedback } from '@/components/features/docs/article-feedback'
import { ArticleSiblings } from '@/components/features/docs/article-siblings'
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
      <ArticleSiblings faq={category?.slug === 'faq'} siblings={siblings} slug={article.slug} />
    </article>
  )
}
