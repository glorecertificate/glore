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
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 md:py-16">
      <Logo className="w-28" />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight" data-testid="legal-accept-title">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
        {content.effectiveAt && (
          <p className="text-sm text-muted-foreground">
            {t('effective', {
              date: format.dateTime(new Date(content.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
            })}
          </p>
        )}
      </header>
      {content.locale !== locale && <Banner variant="info">{t('fallbackNotice')}</Banner>}
      <section
        aria-label={content.title}
        className="max-h-[50vh] overflow-y-auto rounded-lg border p-6"
        data-testid="legal-accept-body"
        tabIndex={0}
      >
        <h2 className="text-xl font-semibold">{content.title}</h2>
        <LegalMarkdown>{content.body}</LegalMarkdown>
      </section>
      <p className="text-sm">
        <Link className="underline underline-offset-4" href="/terms" rel="noopener noreferrer" target="_blank">
          {t('openFull')}
        </Link>
      </p>
      <LegalAcceptForm />
    </main>
  )
}

const LegalAcceptPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <LegalAcceptContent />
  </Suspense>
)

export default LegalAcceptPage
