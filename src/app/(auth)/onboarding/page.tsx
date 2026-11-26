import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { eq } from 'drizzle-orm'
import { type Locale } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { AuthMain } from '@/components/features/auth/auth-frame'
import { OnboardingForm } from '@/components/features/onboarding'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { I18nProvider } from '@/components/providers/i18n'
import { MessagesScope } from '@/components/providers/messages-scope'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { AUTH_ROOT } from '@/lib/constants'
import { getLocaleCookie } from '@/lib/cookie-store'
import { DEFAULT_LOCALE, pickMessages } from '@/lib/i18n'
import { MESSAGE_SCOPES } from '@/lib/message-scopes'
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
    <I18nProvider locale={locale} messages={pickMessages(messages, [...MESSAGE_SCOPES.root, ...MESSAGE_SCOPES.auth])}>
      <MessagesScope locale={locale} scope="onboarding">
        <AuthMain language={false} size="md">
          <OnboardingForm
            email={user.email}
            firstName={profile?.firstName ?? ''}
            lastName={profile?.lastName ?? ''}
            locale={locale}
          />
        </AuthMain>
      </MessagesScope>
    </I18nProvider>
  )
}

const OnboardingPage = () => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <OnboardingContent />
  </Suspense>
)

export default OnboardingPage
