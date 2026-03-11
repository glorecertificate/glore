'use client'

import { useEffect, useState } from 'react'

type PWADisplayMode = 'twa' | 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' | 'window-controls-overlay'

const getDisplayMode = (): PWADisplayMode | undefined => {
  if (document.referrer.startsWith('android-app://')) return 'twa'
  if (window.matchMedia('(display-mode: browser)').matches) return 'browser'
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return 'window-controls-overlay'
}

/**
 * Determines the progressive web application display.
 */
export const usePWA = () => {
  const [displayMode, setDisplayMode] = useState<PWADisplayMode | undefined>(undefined)

  useEffect(() => {
    setDisplayMode(getDisplayMode())
  }, [])

  return {
    displayMode,
    isPWA: Boolean(displayMode),
  }
}
