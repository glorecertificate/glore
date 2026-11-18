import { getTranslations } from 'next-intl/server'

import { type ReadingHeading } from '@/components/features/docs/headings'
import { TocLinks } from '@/components/features/docs/toc-links'
import { LucideIcon } from '@/components/icons/lucide'

const TOC_MIN_HEADINGS = 3

export const ReadingToc = async ({ headings: all }: { headings: ReadingHeading[] }) => {
  const headings = all.filter(({ level }) => level > 1)
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
