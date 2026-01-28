'use client'

import { useCallback, useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Detects the device type based on the window width.
 */
export const useDevice = (breakpoint = MOBILE_BREAKPOINT) => {
  const detectType = useCallback(() => {
    if (typeof window === 'undefined') return
    return window.innerWidth < breakpoint ? 'mobile' : 'desktop'
  }, [breakpoint])

  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | undefined>(detectType())
  const [isTouch, setIsTouch] = useState(false)

  const handleResize = useCallback(() => {
    setDeviceType(detectType())
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.maxTouchPoints > 0)
  }, [detectType])

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    handleResize()
    mql.addEventListener('change', handleResize)
    return () => mql.removeEventListener('change', handleResize)
  }, [handleResize])

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isDesktop: deviceType === 'desktop',
    isTouch,
  }
}
