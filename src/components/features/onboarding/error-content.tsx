'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import { AUTH_ROOT } from '@/lib/constants'

export const OnboardingErrorContent = () => {
  const t = useTranslations('Join')
  const { email } = useSettings()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <LucideIcon name="circle-alert" className="size-8 text-destructive-text" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">{t('errorTitle')}</h1>
        <p className="mb-8 text-muted-foreground">{t('errorDescription', { email })}</p>
        <Button asChild variant="outline">
          <a href={AUTH_ROOT}>{t('backToLogin')}</a>
        </Button>
      </div>
    </div>
  )
}
