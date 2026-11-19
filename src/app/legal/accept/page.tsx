import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { AuthCaption } from '@/components/features/auth/auth-caption'
import { AuthFrame } from '@/components/features/auth/auth-frame'
import { LegalAcceptForm } from '@/components/features/legal/legal-accept-form'
import { LegalMarkdown } from '@/components/features/legal/legal-markdown'
import { LoadingFallback } from '@/components/layout/loading-fallback'
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="type-title text-balance" data-testid="legal-accept-title">
          {t('title')}
        </h1>
        <p className="text-pretty text-muted-foreground">{t('description')}</p>
        {content.effectiveAt && (
          <p className="type-caption text-muted-foreground">
            {t('effective', {
              date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
            })}
          </p>
        )}
      </div>
      <section
        aria-label={content.title}
        className="max-h-[50svh] overflow-y-auto rounded-lg border border-border-subtle bg-card p-4 outline-none focus-visible:focus-ring-inset"
        data-testid="legal-accept-body"
        tabIndex={0}
      >
        <h2 className="type-heading">{content.title}</h2>
        <LegalMarkdown>{content.body}</LegalMarkdown>
      </section>
      {content.locale !== locale && <Banner variant="info">{t('fallbackNotice')}</Banner>}
      <p className="text-sm">
        <Link
          className="rounded-sm text-action-text underline-offset-4 transition-colors outline-none hover:text-link hover:underline focus-visible:focus-ring motion-reduce:transition-none"
          href="/terms"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('openFull')}
        </Link>
      </p>
      <LegalAcceptForm />
    </div>
  )
}

const LegalAcceptPage = () => (
  <AuthFrame language={false} panel={<AuthCaption messageKey="panelLegal" />} size="lg">
    <Suspense fallback={<LoadingFallback />}>
      <LegalAcceptContent />
    </Suspense>
  </AuthFrame>
)

export default LegalAcceptPage
