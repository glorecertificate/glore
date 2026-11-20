import { Suspense } from 'react'

import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { BrandShell } from '@/components/features/auth/brand-shell'
import { extractHeadings, headingIdsByLine } from '@/components/features/docs/headings'
import { ReadingToc } from '@/components/features/docs/reading-toc'
import { LegalLanguageSwitch } from '@/components/features/legal/legal-language-switch'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { type LegalDocument } from '@/db/queries/legal'
import { loadLegalDocument } from '@/lib/legal'

const KEYS = { privacy: 'privacy', terms: 'terms' } as const

const LegalDocumentContent = async ({ document }: { document: LegalDocument }) => {
  const [locale, t, format] = await Promise.all([getLocale(), getTranslations('Legal'), getFormatter()])
  const content = await loadLegalDocument(document, locale)
  const headings = content ? extractHeadings(content.body) : []

  return (
    <BrandShell
      actions={<LegalLanguageSwitch locale={locale} />}
      description={
        content?.effectiveAt && (
          <span className="flex items-center gap-1.5 text-sm" data-testid="legal-updated">
            <LucideIcon name="calendar" className="size-3.5 shrink-0" />
            {t('updated', {
              date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
            })}
          </span>
        )
      }
      size="lg"
      title={<span data-testid="legal-title">{content?.title ?? t(KEYS[document])}</span>}
    >
      {content ? (
        <Card className="gap-0 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-4 lg:gap-10">
            <div className="min-w-0 lg:order-last lg:col-span-1">
              <ReadingToc headings={headings} />
            </div>
            <div className="max-w-prose min-w-0 lg:col-span-3" data-testid="legal-body">
              <LegalMarkdown ids={headingIdsByLine(headings)}>{content.body}</LegalMarkdown>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <p className="text-fg-2">{t('unavailable')}</p>
        </Card>
      )}

      {content && content.locale !== locale && (
        <Banner data-testid="legal-fallback" variant="info">
          {t('fallbackNotice')}
        </Banner>
      )}

      <footer className="flex justify-center">
        <LegalLinks />
      </footer>
    </BrandShell>
  )
}

export const LegalPage = ({ document }: { document: LegalDocument }) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <LegalDocumentContent document={document} />
  </Suspense>
)
