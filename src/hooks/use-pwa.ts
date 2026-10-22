'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

type DisplayMode = ReturnType<typeof getDisplayMode>

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const publish = (next: BeforeInstallPromptEvent | null) => {
  deferredPrompt = next
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    publish(event as BeforeInstallPromptEvent)
  })
  window.addEventListener('appinstalled', () => publish(null))
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
  const prompt = useSyncExternalStore(
    subscribe,
    () => deferredPrompt,
    () => null
  )
  const [installed, setInstalled] = useState(false)
  const [ios, setIos] = useState(false)
  const displayModeRef = useRef<DisplayMode>(undefined)

  const promptInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome !== 'accepted') return
    setInstalled(true)
    publish(null)
  }

  useEffect(() => {
    const displayMode = getDisplayMode()
    displayModeRef.current = displayMode
    void registerServiceWorker()
    setInstalled(displayMode === 'standalone' || ('standalone' in navigator && navigator.standalone === true))
    setIos(/iPad|iPhone|iPod/u.test(navigator.userAgent))
  }, [])

  return {
    canInstall: Boolean(prompt) && !installed,
    displayMode: displayModeRef.current as DisplayMode,
    installed,
    ios,
    promptInstall,
  }
}
