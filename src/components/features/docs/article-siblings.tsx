'use client'

import { useTranslations } from 'next-intl'

import { isListedArticle } from '@/components/features/docs/visibility'
import { useHelpRole } from '@/components/features/help/use-help-role'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Link } from '@/components/ui/link'
import { pickLocale } from '@/db/queries/learning'
import { type IntlRecord } from '@/lib/i18n'

interface ArticleSibling {
  audiences: string[]
  slug: string
  title: IntlRecord
}

interface ArticleSiblingsProps {
  faq: boolean
  siblings: ArticleSibling[]
  slug: string
}

export const ArticleSiblings = ({ faq, siblings, slug }: ArticleSiblingsProps) => {
  const t = useTranslations('Docs')
  const { locale } = useI18n()
  const role = useHelpRole()

  const listed = siblings.filter(sibling => sibling.slug === slug || isListedArticle(sibling, role))
  const related = faq ? listed.filter(item => item.slug !== slug).slice(0, 4) : []
  const index = listed.findIndex(sibling => sibling.slug === slug)
  const previous = listed[index - 1]
  const next = listed[index + 1]

  return (
    <>
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
    </>
  )
}
