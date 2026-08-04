'use client'

import { AlertCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { AUTH_ROOT } from '@/lib/constants'
import metadata from '~/config/metadata.json'

export const OnboardingErrorContent = () => {
  const t = useTranslations('Join')

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="size-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">{t('errorTitle')}</h1>
        <p className="mb-8 text-muted-foreground">{t('errorDescription', { email: metadata.email })}</p>
        <Button asChild variant="outline">
          <a href={AUTH_ROOT}>{t('backToLogin')}</a>
        </Button>
      </div>
    </div>
  )
}
