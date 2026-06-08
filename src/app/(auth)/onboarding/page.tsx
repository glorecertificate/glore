import { redirect } from 'next/navigation'

import { desc, eq } from 'drizzle-orm'
import { type Locale } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { getLocaleCookie } from '@/actions/cookies'
import { OnboardingForm } from '@/components/features/onboarding/onboarding-form'
import { I18nProvider } from '@/components/providers/i18n-context'
import { db } from '@/db/client'
import { teamInvitations } from '@/db/schema'
import { AUTH_ROOT } from '@/lib/constants'
import { i18n } from '@/lib/i18n'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Onboarding',
    title: 'title',
  })

const OnboardingPage = async () => {
  const user = await getAuthUser()
  if (!user?.email) redirect(AUTH_ROOT)

  const invitation = await db.query.teamInvitations.findFirst({
    where: eq(teamInvitations.userId, user.id),
    columns: { firstName: true, lastName: true, locale: true },
    orderBy: desc(teamInvitations.createdAt),
  })

  const locale = (invitation?.locale as Locale) ?? (await getLocaleCookie()) ?? i18n.defaultLocale
  const messages = await getMessages({ locale })

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <I18nProvider value={{ locale, messages }}>
          <OnboardingForm
            email={user.email}
            firstName={invitation?.firstName ?? ''}
            lastName={invitation?.lastName ?? ''}
            locale={locale}
          />
        </I18nProvider>
      </div>
    </div>
  )
}

export default OnboardingPage
