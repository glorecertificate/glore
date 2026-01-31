import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { type Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { OnboardingForm } from '@/components/features/onboarding/onboarding-form'
import { GloreIcon } from '@/components/icons/glore'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { getServiceDatabase } from '@/db/client'
import { AUTH_ROOT } from '@/lib/constants'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Onboarding',
    title: 'title',
  })

const OnboardingPage = async () => {
  const user = await getAuthUser()
  if (!user?.email) redirect(AUTH_ROOT)

  const db = await getServiceDatabase()
  const { data: invitation } = await db
    .from('team_invitations')
    .select('first_name, last_name, locale')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const t = await getTranslations('Onboarding')

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-8">
          <GloreIcon className="w-40" />
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground text-sm">{t('description')}</p>
          </div>
        </div>
        <OnboardingForm
          email={user.email}
          firstName={invitation?.first_name ?? ''}
          lastName={invitation?.last_name ?? ''}
          locale={(invitation?.locale as Locale) ?? 'en'}
        />
      </div>
    </div>
  )
}

export default () => (
  <Suspense fallback={<LoadingFallback />}>
    <OnboardingPage />
  </Suspense>
)
