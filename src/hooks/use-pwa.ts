'use client'

import { useEffect, useRef, useState } from 'react'

type DisplayMode = ReturnType<typeof getDisplayMode>

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const getDisplayMode = () => {
  if (typeof window === 'undefined') return
  if (document.referrer.startsWith('android-app://')) return 'twa'
  if (window.matchMedia('(display-mode: browser)').matches) return 'browser'
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return 'window-controls-overlay'
}

const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
  // eslint-disable-next-line no-underscore-dangle
  const buildId = encodeURIComponent(window.__NEXT_DATA__?.buildId ?? 'dev')
  return await navigator.serviceWorker.register(`/sw.js?buildId=${buildId}`)
}

export const usePWA = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const displayModeRef = useRef<DisplayMode>(undefined)

  const promptInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome !== 'accepted') return
    setInstalled(true)
    setPrompt(null)
  }

  const beforeInstall = (e: Event) => {
    e.preventDefault()
    setPrompt(e as BeforeInstallPromptEvent)
  }

  useEffect(() => {
    const displayMode = getDisplayMode()
    displayModeRef.current = displayMode
    void registerServiceWorker()
    window.addEventListener('beforeinstallprompt', beforeInstall)
    setInstalled(displayMode === 'standalone' || ('standalone' in navigator && navigator.standalone === true))
    return () => window.removeEventListener('beforeinstallprompt', beforeInstall)
  }, [])

  return {
    canInstall: Boolean(prompt) && !installed,
    displayMode: displayModeRef.current as DisplayMode,
    installed,
    promptInstall,
  }
}
