import { getTranslations } from 'next-intl/server'

import { type ReadingHeading } from '@/components/features/docs/headings'
import { LucideIcon } from '@/components/icons/lucide'
import { cn } from '@/lib/utils'

const TOC_MIN_HEADINGS = 3

const TocLinks = ({ headings }: { headings: ReadingHeading[] }) => (
  <ol className="flex flex-col gap-0.5 border-l border-border-subtle text-sm">
    {headings.map(({ id, level, text }) => (
      <li key={id}>
        <a
          className={cn(
            '-ml-px block border-l border-transparent py-1 pr-2 text-fg-2 transition-colors hover:border-border-strong hover:text-fg-1 focus-visible:text-fg-1',
            level === 3 ? 'pl-6' : 'pl-3'
          )}
          href={`#${id}`}
        >
          {text}
        </a>
      </li>
    ))}
  </ol>
)

export const ReadingToc = async ({ headings }: { headings: ReadingHeading[] }) => {
  if (headings.length < TOC_MIN_HEADINGS) return null
  const t = await getTranslations('Docs')

  return (
    <>
      <details className="group rounded-lg border bg-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 type-label text-fg-1 [&::-webkit-details-marker]:hidden">
          {t('article.onThisPage')}
          <LucideIcon name="chevron-down" className="size-4 text-fg-2 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-3">
          <TocLinks headings={headings} />
        </div>
      </details>
      <nav aria-label={t('article.onThisPage')} className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <p className="mb-3 type-label text-fg-1">{t('article.onThisPage')}</p>
        <TocLinks headings={headings} />
      </nav>
    </>
  )
}
