'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { holdPrefetch, isPrefetchHeld, keptHrefs, prefetchFull } from '@/lib/prefetch'

const TICK_MS = 2000
const IDLE_MS = 5 * 60 * 1000
const NAVIGATION_HOLD_MS = 4000
const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'pointermove', 'scroll', 'touchstart'] as const

export const PrefetchKeeper = () => {
  const router = useRouter()

  useEffect(() => {
    let lastActive = Date.now()

    const refresh = () => {
      if (document.visibilityState !== 'visible' || isPrefetchHeld()) return
      for (const href of keptHrefs()) prefetchFull(router, href)
    }

    const wake = (event: Event) => {
      const idle = Date.now() - lastActive > IDLE_MS
      lastActive = Date.now()
      if (event.type === 'pointerdown' && event.target instanceof Element && event.target.closest('a[href]')) {
        holdPrefetch(NAVIGATION_HOLD_MS)
        return
      }
      if (idle) refresh()
    }

    const tick = () => {
      if (Date.now() - lastActive > IDLE_MS) return
      refresh()
    }

    const timer = window.setInterval(tick, TICK_MS)
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, wake, { capture: true, passive: true })
    document.addEventListener('visibilitychange', refresh)
    refresh()

    return () => {
      window.clearInterval(timer)
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, wake, { capture: true })
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router])

  return null
}
