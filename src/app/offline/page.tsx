'use client'

import { WifiOffIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

export default () => {
  const t = useTranslations('PWA')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOffIcon className="size-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">{t('offlineTitle')}</h1>
      <p className="max-w-sm text-muted-foreground">{t('offlineDescription')}</p>
      <Button onClick={() => window.location.reload()}>{t('offlineRetry')}</Button>
    </div>
  )
}
