import Link from 'next/link'
import { Suspense } from 'react'

import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { LegalLanguageSwitch } from '@/components/features/legal/legal-language-switch'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { Logo } from '@/components/ui/logo'
import { type LegalDocument } from '@/db/queries/legal'
import { loadLegalDocument } from '@/lib/legal'

const KEYS = { privacy: 'privacy', 'quality-charter': 'qualityCharter', terms: 'terms' } as const

const LegalDocumentContent = async ({ document }: { document: LegalDocument }) => {
  const [locale, t, format] = await Promise.all([getLocale(), getTranslations('Legal'), getFormatter()])
  const content = await loadLegalDocument(document, locale)

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 md:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link title={t('home')} aria-label={t('home')} href="/">
          <Logo className="w-28" />
        </Link>
        <LegalLanguageSwitch locale={locale} />
      </header>

      <h1 className="mt-12 text-4xl font-semibold tracking-tight" data-testid="legal-title">
        {content?.title ?? t(KEYS[document])}
      </h1>

      {content?.effectiveAt && (
        <p className="mt-2 text-sm text-muted-foreground" data-testid="legal-updated">
          {t('updated', {
            date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
          })}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {content && content.locale !== locale && (
          <Banner data-testid="legal-fallback" variant="info">
            {t('fallbackNotice')}
          </Banner>
        )}
      </div>

      {content ? (
        <div data-testid="legal-body">
          <LegalMarkdown>{content.body}</LegalMarkdown>
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">{t('unavailable')}</p>
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
