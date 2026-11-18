'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'

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
    <main className="flex min-h-svh items-center justify-center px-page py-12">
      <Empty className="max-w-md flex-none border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideIcon name="wifi-off" />
          </EmptyMedia>
          <h1 className="type-title text-balance text-foreground" data-slot="empty-title">
            {t('offlineTitle')}
          </h1>
          <EmptyDescription>{t('offlineDescription')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button icon="refresh-cw" loading={retrying} onClick={retry} variant="outline">
            {t('offlineRetry')}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
