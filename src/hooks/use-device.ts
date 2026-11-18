'use client'

import { useEffect, useRef, useState } from 'react'

import theme from '~/config/theme.json'

/**
 * Returns the current device type (mobile or desktop), whether the viewport is in the tablet range, and whether the device supports touch input.
 */
export const useDevice = (breakpoint = theme.mobileBreakpoint, tabletBreakpoint = theme.tabletBreakpoint) => {
  const detectType = () => {
    if (typeof window === 'undefined') return
    return window.innerWidth < breakpoint ? 'mobile' : 'desktop'
  }

  const detectTablet = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= breakpoint && window.innerWidth < tabletBreakpoint
  }

  const [type, setType] = useState<'mobile' | 'desktop'>()
  const [isTablet, setIsTablet] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  const handleResize = useRef(() => {
    setType(detectType())
    setIsTablet(detectTablet())
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  })

  useEffect(() => {
    const phone = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const tablet = window.matchMedia(`(max-width: ${tabletBreakpoint - 1}px)`)
    const listener = () => handleResize.current()
    listener()
    phone.addEventListener('change', listener)
    tablet.addEventListener('change', listener)
    return () => {
      phone.removeEventListener('change', listener)
      tablet.removeEventListener('change', listener)
    }
  }, [breakpoint, tabletBreakpoint])

  return {
    type,
    isDesktop: type === 'desktop',
    isMobile: type === 'mobile',
    isTablet,
    isTouch,
  }
}
