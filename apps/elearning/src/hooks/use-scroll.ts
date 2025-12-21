'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { throttle } from '@glore/utils/throttle'

const getScroll = () =>
  typeof window === 'undefined'
    ? 0
    : window.pageYOffset !== undefined
      ? window.pageYOffset
      : (document.documentElement || document.body.parentNode || document.body).scrollTop

/**
 * Hook to track the current scroll position of the window.
 */
export const useScroll = () => {
  const [scroll, setScroll] = useState(getScroll())
  const scrolled = useMemo(() => scroll > 0, [scroll])

  const handleScroll = useCallback(
    throttle(() => setScroll(getScroll()), 100),
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return { scroll, scrolled }
}
