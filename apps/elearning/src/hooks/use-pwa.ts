'use client'

import { useMemo } from 'react'

export enum PWADisplayMode {
  TWA = 'twa',
  Browser = 'browser',
  Standalone = 'standalone',
  MinimalUI = 'minimal-ui',
  Fullscreen = 'fullscreen',
  WindowControlsOverlay = 'window-controls-overlay',
}

/**
 * Hook to determine the PWA display mode and related properties.
 */
export const usePWA = () => {
  const displayMode = useMemo<`${PWADisplayMode}` | undefined>(() => {
    if (typeof window === 'undefined') return
    if (document.referrer.startsWith('android-app://')) return 'twa'
    if (window.matchMedia('(display-mode: browser)').matches) return 'browser'
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
    if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return 'window-controls-overlay'
  }, [])

  return {
    displayMode,
    isPWA: !!displayMode,
  }
}
