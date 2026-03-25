'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const urlBase64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = `${base64}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

export const usePWAContext = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js')
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
    setIsInstalled(standalone)

    if ('Notification' in window) {
      setPushPermission(Notification.permission)
      if ('serviceWorker' in navigator) {
        const checkSub = async () => {
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.getSubscription()
          setPushSubscribed(!!sub)
        }
        void checkSub()
      }
    } else {
      setPushPermission('unsupported')
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const canInstall = Boolean(installPrompt) && !isInstalled

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
    }
  }, [installPrompt])

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    const permission = await Notification.requestPermission()
    setPushPermission(permission)
    if (permission !== 'granted') return

    const vapidRes = await fetch('/api/v1/push')
    const { vapidKey } = (await vapidRes.json()) as { vapidKey: string | null }
    if (!vapidKey) return

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
      userVisibleOnly: true,
    })
    await fetch('/api/v1/push', {
      body: JSON.stringify(sub.toJSON()),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    setPushSubscribed(true)
  }, [])

  const unsubscribePush = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await sub.unsubscribe()
    await fetch('/api/v1/push', {
      body: JSON.stringify({ endpoint: sub.endpoint }),
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    })
    setPushSubscribed(false)
  }, [])

  return useMemo(
    () => ({
      canInstall,
      isInstalled,
      promptInstall,
      pushPermission,
      pushSubscribed,
      requestPushPermission,
      unsubscribePush,
    }),
    [canInstall, isInstalled, promptInstall, pushPermission, pushSubscribed, requestPushPermission, unsubscribePush]
  )
}

export const PWAContext = createContext<ReturnType<typeof usePWAContext> | null>(null)
