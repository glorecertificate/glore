'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect the device type based on the window width.
 * Returns the device type and booleans for simplified checks.
 */
export const useDevice = (breakpoint = MOBILE_BREAKPOINT) => {
  const detectType = useCallback(
    () => (typeof window === 'undefined' ? undefined : window.innerWidth < breakpoint ? 'mobile' : 'desktop'),
    [breakpoint],
  )

  const [type, setType] = useState<'mobile' | 'desktop' | undefined>(detectType())

  const isMobile = useMemo(() => type === 'mobile', [type])
  const isDesktop = useMemo(() => type === 'desktop', [type])

  const onWindowChange = useCallback(() => {
    setType(detectType())
  }, [detectType])

  useEffect(() => {
    if (typeof window === 'undefined') return
    onWindowChange()

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener('change', onWindowChange)

    return () => {
      mql.removeEventListener('change', onWindowChange)
    }
  }, [onWindowChange])

  return { type, isMobile, isDesktop }
}
