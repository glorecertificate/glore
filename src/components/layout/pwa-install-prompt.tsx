'use client'

import { useEffect, useEffectEvent } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { usePWA } from '@/hooks/use-pwa'

const TOAST_ID = 'pwa-install'
const STORAGE_KEY = 'pwaInstallDismissedAt'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000
const DELAY_MS = 4000

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

export const PwaInstallPrompt = () => {
  const t = useTranslations('PWA')
  const { canInstall, installed, ios, promptInstall } = usePWA()
  const visible = !installed && (canInstall || ios)

  const show = useEffectEvent(() => {
    toast(t('installTitle'), {
      action: canInstall ? { label: t('installButton'), onClick: () => void promptInstall() } : undefined,
      cancel: { label: t('installDismiss'), onClick: snooze },
      description: canInstall ? t('installDescription') : t('installIosHint'),
      duration: Number.POSITIVE_INFINITY,
      id: TOAST_ID,
      onDismiss: snooze,
    })
  })

  useEffect(() => {
    if (!visible || isSnoozed()) return
    const timer = setTimeout(show, DELAY_MS)
    return () => clearTimeout(timer)
  }, [visible])

  return null
}
