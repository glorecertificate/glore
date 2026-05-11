'use client'

import { useEffect, useRef } from 'react'

import { DownloadIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/use-pwa'

const DISMISSED_KEY = 'pwa-install-dismissed'

export const InstallBanner = () => {
  const t = useTranslations('PWA')
  const { canInstall, promptInstall } = usePWA()
  const dismissedRef = useRef(true)

  useEffect(() => {
    dismissedRef.current = localStorage.getItem(DISMISSED_KEY) === '1'
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    dismissedRef.current = true
  }

  const install = async () => {
    await promptInstall()
    dismiss()
  }

  if (!canInstall || dismissedRef.current) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-80 items-start gap-3 rounded-xl border bg-card p-4 shadow-lg">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold">{t('installTitle')}</p>
        <p className="text-xs text-muted-foreground">{t('installDescription')}</p>
        <div className="mt-2 flex gap-2">
          <Button className="h-8 px-3 text-xs" size="sm" onClick={install}>
            <DownloadIcon className="size-3" />
            {t('installButton')}
          </Button>
          <Button className="h-8 px-3 text-xs" size="sm" variant="ghost" onClick={dismiss}>
            {t('installDismiss')}
          </Button>
        </div>
      </div>
      <Button className="size-6 shrink-0" size="icon" variant="ghost" onClick={dismiss}>
        <XIcon className="size-3.5" />
      </Button>
    </div>
  )
}
