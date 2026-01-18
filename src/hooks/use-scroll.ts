'use client'

import { useEffect, useMemo, useState } from 'react'

import { throttle } from '@/lib/utils'

const getScroll = () => {
  if (typeof window === 'undefined') return 0
  if (window.pageYOffset !== undefined) return window.pageYOffset
  return (document.documentElement || document.body.parentNode || document.body).scrollTop
}

/**
 * Hook to track the current scroll position of the window.
 */
export const useScroll = () => {
  const [scroll, setScroll] = useState(getScroll())
  const scrolled = useMemo(() => scroll > 0, [scroll])

  const onScroll = throttle(() => setScroll(getScroll()), 100)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  return { scroll, scrolled }
}
