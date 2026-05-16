'use client'

import { createContext, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const getBuildId = () => {
  if (typeof window === 'undefined') return 'dev'
  // eslint-disable-next-line no-underscore-dangle
  const nextData = (window as typeof window & { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__
  return nextData?.buildId ?? 'dev'
}

const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const buildId = encodeURIComponent(getBuildId())
      void navigator.serviceWorker.register(`/sw.js?buildId=${buildId}`)
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

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const canInstall = Boolean(installPrompt) && !isInstalled

  const promptInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
    }
  }

  return {
    canInstall,
    isInstalled,
    promptInstall,
  }
}

export const PWAContext = createContext<ReturnType<typeof usePWA> | null>(null)

export const PWAContextProvider = ({ children }: React.PropsWithChildren) => {
  const value = usePWA()
  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>
}
