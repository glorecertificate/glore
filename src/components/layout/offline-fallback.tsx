'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { BrandShell } from '@/components/features/auth/brand-shell'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const OfflineFallback = () => {
  const t = useTranslations('PWA')
  const [retrying, setRetrying] = useState(false)

  const retry = () => {
    setRetrying(true)
    window.location.reload()
  }

  useEffect(() => {
    const reload = () => window.location.reload()
    window.addEventListener('online', reload)
    return () => window.removeEventListener('online', reload)
  }, [])

  return (
    <BrandShell size="sm">
      <Card className="items-center gap-6 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-brand-text">
          <LucideIcon className="size-6" name="wifi-off" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="type-title text-balance text-foreground">{t('offlineTitle')}</h1>
          <p className="text-pretty text-muted-foreground">{t('offlineDescription')}</p>
        </div>
        <Button icon="refresh-cw" loading={retrying} onClick={retry} variant="outline">
          {t('offlineRetry')}
        </Button>
      </Card>
    </BrandShell>
  )
}
