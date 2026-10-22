'use client'

import Link from 'next/link'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { ONBOARDING_NEXT_HREFS, type OnboardingNextStep } from '@/db/queries/onboarding'
import { APP_ROOT } from '@/lib/constants'

export const WelcomeStep = ({
  firstName,
  nextStep,
  username,
}: {
  firstName: string
  nextStep: OnboardingNextStep
  username: string
}) => {
  const t = useTranslations('Onboarding')

  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-welcome">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t('welcomeTitle', { name: firstName })}</h1>
        <p className="text-muted-foreground">{t('welcomeDescription')}</p>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('usernameLabel')}</p>
        <p className="font-mono text-xl font-semibold" data-testid="onboarding-username">
          {username}
        </p>
        <p className="text-sm text-muted-foreground">{t('usernameDescription')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" variant="brand">
          <Link href={ONBOARDING_NEXT_HREFS[nextStep]}>
            <LucideIcon name="arrow-right" />
            {t(`next_${nextStep}`)}
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={APP_ROOT}>{t('goToDashboard')}</Link>
        </Button>
      </div>
    </div>
  )
}
