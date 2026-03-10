'use client'

import { useCallback, useEffect, useState } from 'react'

import theme from '~/config/theme.json'

/**
 * Detects the device type based on the window width.
 */
export const useDevice = (breakpoint = theme.mobileBreakpoint) => {
  const detectType = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    return window.innerWidth < breakpoint ? 'mobile' : 'desktop'
  }, [breakpoint])

  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | undefined>(detectType())
  const [isTouch, setIsTouch] = useState(false)

  const handleResize = useCallback(() => {
    setDeviceType(detectType())
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [detectType])

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    handleResize()
    mql.addEventListener('change', handleResize)
    return () => mql.removeEventListener('change', handleResize)
  }, [breakpoint, handleResize])

  return {
    deviceType,
    isDesktop: deviceType === 'desktop',
    isMobile: deviceType === 'mobile',
    isTouch,
  }
}
