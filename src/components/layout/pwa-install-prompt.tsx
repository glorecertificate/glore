'use client'

import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { usePWA } from '@/hooks/use-pwa'

const TOAST_ID = 'pwa-install'
const STORAGE_KEY = 'pwaInstallDismissedAt'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000
const DELAY_MS = 4000
const TOAST_DURATION_MS = 15_000

const isSnoozed = () => {
  try {
    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY))
    return Boolean(dismissedAt) && Date.now() - dismissedAt < SNOOZE_MS
  } catch {
    return false
  }
}

const snooze = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch (error) {
    console.error('Could not store the install prompt choice', error)
  }
}

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]'
const RECHECK_MS = 1000

const COARSE_QUERY = '(pointer: coarse)'

const subscribeTouch = (listener: () => void) => {
  const query = window.matchMedia(COARSE_QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

const useTouch = () =>
  useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(COARSE_QUERY).matches,
    () => undefined
  )

export const PwaInstallPrompt = () => {
  const t = useTranslations('PWA')
  const touch = useTouch()
  const { canInstall, installed, ios, promptInstall } = usePWA()
  const visible = touch === false && !installed && (canInstall || ios)

  const show = useEffectEvent(() => {
    toast(t('installTitle'), {
      action: canInstall ? { label: t('installButton'), onClick: () => void promptInstall() } : undefined,
      cancel: { label: t('installDismiss'), onClick: snooze },
      description: canInstall ? t('installDescription') : t('installIosHint'),
      duration: TOAST_DURATION_MS,
      id: TOAST_ID,
      onAutoClose: snooze,
      onDismiss: snooze,
    })
  })

  useEffect(() => {
    if (!visible || isSnoozed()) return
    let timer = setTimeout(function tick() {
      if (document.querySelector(DIALOG_SELECTOR)) {
        timer = setTimeout(tick, RECHECK_MS)
        return
      }
      show()
    }, DELAY_MS)
    return () => clearTimeout(timer)
  }, [visible])

  return null
}

export const PwaInstallBanner = () => {
  const t = useTranslations('PWA')
  const touch = useTouch()
  const { canInstall, installed, ios, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setDismissed(isSnoozed()), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!touch || dismissed || installed || !(canInstall || ios)) return null

  const dismiss = () => {
    snooze()
    setDismissed(true)
  }

  return (
    <section
      aria-label={t('installTitle')}
      className="flex items-center gap-3 border-b bg-card px-page py-2.5"
      data-slot="pwa-install-banner"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-medium">{t('installTitle')}</p>
        <p className="type-caption text-muted-foreground">
          {canInstall ? t('installDescription') : t('installIosHint')}
        </p>
      </div>
      {canInstall && (
        <Button onClick={() => void promptInstall()} size="sm" variant="brand">
          {t('installButton')}
        </Button>
      )}
      <Button aria-label={t('installDismiss')} onClick={dismiss} size="icon-sm" variant="ghost">
        <LucideIcon name="x" />
      </Button>
    </section>
  )
}
