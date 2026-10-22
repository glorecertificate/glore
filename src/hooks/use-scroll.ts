'use client'

import { useSyncExternalStore } from 'react'

import { throttle } from '@/lib/utils'

const subscribe = (onChange: () => void) => {
  const handler = throttle(onChange, 100)
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}

const getScroll = () => document.documentElement.scrollTop

const getServerScroll = () => 0

/**
 * Tracks the current scroll position of the window.
 */
export const useScroll = () => {
  const scroll = useSyncExternalStore(subscribe, getScroll, getServerScroll)
  return { scroll, scrolled: scroll > 0 }
}
