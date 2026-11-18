import Link from 'next/link'
import { Suspense } from 'react'

import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { extractHeadings, headingIdsByLine } from '@/components/features/docs/headings'
import { ReadingToc } from '@/components/features/docs/reading-toc'
import { LegalLanguageSwitch } from '@/components/features/legal/legal-language-switch'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { Logo } from '@/components/ui/logo'
import { PageHeader, PageHeaderHeading, PageHeaderTitle } from '@/components/ui/page-header'
import { type LegalDocument } from '@/db/queries/legal'
import { loadLegalDocument } from '@/lib/legal'

const KEYS = { privacy: 'privacy', 'quality-charter': 'qualityCharter', terms: 'terms' } as const

const LegalDocumentContent = async ({ document }: { document: LegalDocument }) => {
  const [locale, t, format] = await Promise.all([getLocale(), getTranslations('Legal'), getFormatter()])
  const content = await loadLegalDocument(document, locale)
  const headings = content ? extractHeadings(content.body) : []

  return (
    <main className="mx-auto w-full max-w-4xl px-page py-8 md:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link aria-label={t('home')} className="rounded-md focus-visible:focus-ring" href="/" title={t('home')}>
          <Logo className="w-28" />
        </Link>
        <LegalLanguageSwitch locale={locale} />
      </header>

      <PageHeader className="mt-12 md:mt-16">
        <PageHeaderHeading>
          <PageHeaderTitle className="type-display" data-testid="legal-title">
            {content?.title ?? t(KEYS[document])}
          </PageHeaderTitle>
          {content?.effectiveAt && (
            <p className="flex items-center gap-1.5 text-sm text-fg-2" data-testid="legal-updated">
              <LucideIcon name="calendar" className="size-3.5 shrink-0" />
              {t('updated', {
                date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
              })}
            </p>
          )}
        </PageHeaderHeading>
      </PageHeader>

      {content && content.locale !== locale && (
        <Banner className="mt-6" data-testid="legal-fallback" variant="info">
          {t('fallbackNotice')}
        </Banner>
      )}

      {content ? (
        <div className="mt-8 grid gap-8 border-t pt-8 lg:grid-cols-4 lg:gap-10">
          <div className="min-w-0 lg:order-last lg:col-span-1">
            <ReadingToc headings={headings} />
          </div>
          <div className="max-w-prose min-w-0 lg:col-span-3" data-testid="legal-body">
            <LegalMarkdown ids={headingIdsByLine(headings)}>{content.body}</LegalMarkdown>
          </div>
        </div>
      ) : (
        <p className="mt-8 border-t pt-8 text-fg-2">{t('unavailable')}</p>
      )}

      <footer className="mt-16 border-t pt-6">
        <LegalLinks />
      </footer>
    </main>
  )
}

export const LegalPage = ({ document }: { document: LegalDocument }) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <LegalDocumentContent document={document} />
  </Suspense>
)
