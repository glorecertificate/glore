import { redirect } from 'next/navigation'

import { desc, eq } from 'drizzle-orm'
import { type Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { OnboardingForm } from '@/components/features/onboarding/onboarding-form'
import { Logo } from '@/components/ui/logo'
import { db } from '@/db/client'
import { teamInvitations } from '@/db/schema'
import { AUTH_ROOT } from '@/lib/constants'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Onboarding',
    title: 'title',
  })

const OnboardingPage = async () => {
  const [user, t] = await Promise.all([getAuthUser(), getTranslations('Onboarding')])
  if (!user?.email) redirect(AUTH_ROOT)

  const invitation = await db.query.teamInvitations.findFirst({
    where: eq(teamInvitations.userId, user.id),
    columns: { firstName: true, lastName: true, locale: true },
    orderBy: desc(teamInvitations.createdAt),
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-8">
          <Logo className="w-40" />
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <OnboardingForm
          email={user.email}
          firstName={invitation?.firstName ?? ''}
          lastName={invitation?.lastName ?? ''}
          locale={(invitation?.locale as Locale) ?? 'en'}
        />
      </div>
    </div>
  )
}

export default OnboardingPage
