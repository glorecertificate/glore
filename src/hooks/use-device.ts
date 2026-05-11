'use client'

import { useEffect, useRef, useState } from 'react'

import theme from '~/config/theme.json'

/**
 * Detects the device type based on the window width.
 */
export const useDevice = (breakpoint = theme.mobileBreakpoint) => {
  const detectType = () => {
    if (typeof window === 'undefined') {
      return
    }
    return window.innerWidth < breakpoint ? 'mobile' : 'desktop'
  }

  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | undefined>(detectType)
  const [isTouch, setIsTouch] = useState(false)

  const handleResize = useRef(() => {
    setDeviceType(detectType())
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  })

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const listener = () => handleResize.current()
    listener()
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [breakpoint])

  return {
    deviceType,
    isDesktop: deviceType === 'desktop',
    isMobile: deviceType === 'mobile',
    isTouch,
  }
}
