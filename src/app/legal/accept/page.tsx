import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { LegalAcceptForm } from '@/components/features/legal/legal-accept-form'
import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { Logo } from '@/components/ui/logo'
import { PageHeader, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from '@/components/ui/page-header'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { getPendingLegal, loadLegalDocument } from '@/lib/legal'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'LegalAccept',
  title: 'title',
})

const LegalAcceptContent = async () => {
  const user = await getAuthUser()
  if (!user) redirect(AUTH_ROOT)
  const pending = await getPendingLegal(user.id, { cache: false })
  if (!pending) redirect(APP_ROOT)

  const [locale, t, format] = await Promise.all([getLocale(), getTranslations('LegalAccept'), getFormatter()])
  const content = await loadLegalDocument(pending.slug, locale, { cache: false })
  if (!content) redirect(APP_ROOT)

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-8 md:space-y-8 md:py-16">
      <Logo className="w-28" />
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle data-testid="legal-accept-title">{t('title')}</PageHeaderTitle>
          <PageHeaderDescription>{t('description')}</PageHeaderDescription>
          {content.effectiveAt && (
            <p className="type-caption text-muted-foreground">
              {t('effective', {
                date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
              })}
            </p>
          )}
        </PageHeaderHeading>
      </PageHeader>
      {content.locale !== locale && <Banner variant="info">{t('fallbackNotice')}</Banner>}
      <section
        aria-label={content.title}
        className="rounded-lg border bg-surface-0 p-6 outline-none focus-visible:focus-ring-inset md:max-h-[50vh] md:overflow-y-auto"
        data-testid="legal-accept-body"
        tabIndex={0}
      >
        <h2 className="type-heading">{content.title}</h2>
        <LegalMarkdown>{content.body}</LegalMarkdown>
      </section>
      <p className="text-sm">
        <Link
          className="text-action-text underline underline-offset-4"
          href="/terms"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('openFull')}
        </Link>
      </p>
      <div className="sticky bottom-0 -mx-6 border-t bg-background px-6 py-4 md:static md:mx-0 md:border-0 md:p-0">
        <LegalAcceptForm />
      </div>
    </main>
  )
}

const LegalAcceptPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <LegalAcceptContent />
  </Suspense>
)

export default LegalAcceptPage
