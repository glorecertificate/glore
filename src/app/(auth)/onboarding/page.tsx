import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { eq } from 'drizzle-orm'
import { type Locale } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { BrandShell } from '@/components/features/auth/brand-shell'
import { OnboardingForm } from '@/components/features/onboarding'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { I18nProvider } from '@/components/providers/i18n'
import { Card } from '@/components/ui/card'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { AUTH_ROOT } from '@/lib/constants'
import { getLocaleCookie } from '@/lib/cookie-store'
import { DEFAULT_LOCALE, clientMessages } from '@/lib/i18n'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Onboarding',
  title: 'title',
})

const OnboardingContent = async () => {
  const user = await getAuthUser()
  if (!user?.email) redirect(AUTH_ROOT)

  const profile = await db.query.users.findFirst({
    columns: { firstName: true, lastName: true, locale: true },
    where: eq(users.id, user.id),
  })

  const locale = (profile?.locale as Locale | null) ?? (await getLocaleCookie()) ?? DEFAULT_LOCALE
  const messages = await getMessages({ locale })

  return (
    <BrandShell size="xs">
      <Card className="gap-8 p-6 sm:p-8">
        <I18nProvider locale={locale} messages={clientMessages(messages)}>
          <OnboardingForm
            email={user.email}
            firstName={profile?.firstName ?? ''}
            lastName={profile?.lastName ?? ''}
            locale={locale}
          />
        </I18nProvider>
      </Card>
    </BrandShell>
  )
}

const OnboardingPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <OnboardingContent />
  </Suspense>
)

export default OnboardingPage
