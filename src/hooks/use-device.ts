'use client'

import { useEffect, useRef, useState } from 'react'

import theme from '~/config/theme.json'

/**
 * Returns the current device type (mobile or desktop) and whether the device supports touch input.
 */
export const useDevice = (breakpoint = theme.mobileBreakpoint) => {
  const detectType = () => {
    if (typeof window === 'undefined') return
    return window.innerWidth < breakpoint ? 'mobile' : 'desktop'
  }

  const [type, setType] = useState<'mobile' | 'desktop' | undefined>(detectType)
  const [isTouch, setIsTouch] = useState(false)

  const handleResize = useRef(() => {
    setType(detectType())
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
    type,
    isDesktop: type === 'desktop',
    isMobile: type === 'mobile',
    isTouch,
  }
}
