import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { BrandShell } from '@/components/features/auth/brand-shell'
import { LegalAcceptForm } from '@/components/features/legal/legal-accept-form'
import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { MessagesScope } from '@/components/providers/messages-scope'
import { Banner } from '@/components/ui/banner'
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
    <BrandShell
      description={
        <>
          {t('description')}
          {content.effectiveAt && (
            <span className="mt-1 block type-caption text-band-muted">
              {t('effective', {
                date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
              })}
            </span>
          )}
        </>
      }
      size="md"
      title={<span data-testid="legal-accept-title">{t('title')}</span>}
    >
      <section
        aria-label={content.title}
        className="rounded-xl border border-border-subtle bg-card p-6 shadow-card outline-none focus-visible:focus-ring-inset md:max-h-[50vh] md:overflow-y-auto"
        data-testid="legal-accept-body"
        tabIndex={0}
      >
        <h2 className="type-heading">{content.title}</h2>
        <LegalMarkdown>{content.body}</LegalMarkdown>
      </section>
      {content.locale !== locale && <Banner variant="info">{t('fallbackNotice')}</Banner>}
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
      <div className="sticky bottom-0 -mx-4 border-t bg-canvas p-4 sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <LegalAcceptForm />
      </div>
    </BrandShell>
  )
}

const LegalAcceptPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <MessagesScope scope="legalAccept">
      <LegalAcceptContent />
    </MessagesScope>
  </Suspense>
)

export default LegalAcceptPage
