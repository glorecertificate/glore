'use client'

import { useEffect, useRef, useState } from 'react'

import { throttle } from '@/lib/utils'

const getScroll = () => (typeof window === 'undefined' ? 0 : document.documentElement.scrollTop)

/**
 * Tracks the current scroll position of the window.
 */
export const useScroll = () => {
  const [scroll, setScroll] = useState(getScroll)
  const scrolled = scroll > 0

  const onScrollRef = useRef<ReturnType<typeof throttle> | undefined>(undefined)
  onScrollRef.current ??= throttle(() => setScroll(getScroll()), 100)

  useEffect(() => {
    const handler = onScrollRef.current
    if (!handler) return
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return { scroll, scrolled }
}
