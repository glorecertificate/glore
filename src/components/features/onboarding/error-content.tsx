'use client'

import { useTranslations } from 'next-intl'

import { BrandShell } from '@/components/features/auth/brand-shell'
import { LucideIcon } from '@/components/icons/lucide'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AUTH_ROOT } from '@/lib/constants'

export const OnboardingErrorContent = () => {
  const t = useTranslations('Join')
  const { email } = useSettings()

  return (
    <BrandShell size="sm">
      <Card className="items-center gap-0 p-8 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-danger-subtle">
          <LucideIcon name="circle-alert" className="size-8 text-destructive-text" />
        </div>
        <h1 className="mb-2 type-title text-balance">{t('errorTitle')}</h1>
        <p className="mb-8 text-muted-foreground">{t('errorDescription', { email })}</p>
        <Button asChild variant="outline">
          <a href={AUTH_ROOT}>{t('backToLogin')}</a>
        </Button>
      </Card>
    </BrandShell>
  )
}
