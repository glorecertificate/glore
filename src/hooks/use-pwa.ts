'use client'

import { use, useEffect, useRef } from 'react'

import { PWAContext } from '@/components/providers/pwa-context'

const getDisplayMode = () => {
  if (typeof window === 'undefined') return
  if (document.referrer.startsWith('android-app://')) return 'twa'
  if (window.matchMedia('(display-mode: browser)').matches) return 'browser'
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return 'window-controls-overlay'
}

export const usePWA = () => {
  const context = use(PWAContext)
  const displayModeRef = useRef<ReturnType<typeof getDisplayMode> | undefined>(undefined)
  if (!context) throw new Error('usePWA must be used within a PWAContextProvider')

  useEffect(() => {
    displayModeRef.current = getDisplayMode()
  }, [])

  return {
    ...context,
    isPWA: Boolean(displayModeRef.current),
    displayMode: displayModeRef.current,
  }
}
