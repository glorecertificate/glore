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
  const displayMode = useMemo<PWADisplayMode | undefined>(() => {
    if (typeof window === 'undefined') return
    if (document.referrer.startsWith('android-app://')) return PWADisplayMode.TWA
    if (window.matchMedia('(display-mode: browser)').matches) return PWADisplayMode.Browser
    if (window.matchMedia('(display-mode: standalone)').matches) return PWADisplayMode.Standalone
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return PWADisplayMode.MinimalUI
    if (window.matchMedia('(display-mode: fullscreen)').matches) return PWADisplayMode.Fullscreen
    if (window.matchMedia('(display-mode: window-controls-overlay)').matches)
      return PWADisplayMode.WindowControlsOverlay
  }, [])

  return {
    displayMode,
    isPWA: !!displayMode,
  }
}
