'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { isServer } from '@repo/utils/is-server'

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect the device type based on the window width.
 *
 * Returns the device type and booleans for simplified checks.
 */
export const useDevice = (breakpoint = MOBILE_BREAKPOINT) => {
  const detectSize = useCallback(() => {
    if (isServer()) return undefined
    return window.innerWidth < breakpoint ? 'mobile' : 'desktop'
  }, [breakpoint])

  const [size, setSize] = useState<'mobile' | 'desktop' | undefined>(detectSize())
  const [isTouch, setIsTouch] = useState(false)

  const isMobile = useMemo(() => size === 'mobile', [size])
  const isDesktop = useMemo(() => size === 'desktop', [size])

  const onResize = useCallback(() => {
    setSize(detectSize())
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.maxTouchPoints > 0)
  }, [detectSize])

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    onResize()

    mql.addEventListener('change', onResize)
    mql.addEventListener('resize', onResize)

    return () => {
      mql.removeEventListener('change', onResize)
      mql.removeEventListener('resize', onResize)
    }
  }, [onResize])

  return { size, isMobile, isDesktop, isTouch }
}
