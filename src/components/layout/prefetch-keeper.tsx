'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { holdPrefetch, isEagerDevice, isPrefetchHeld, keptHrefs, prefetchFull } from '@/lib/prefetch'

const TICK_MS = 2000
const IDLE_MS = 5 * 60 * 1000
const NAVIGATION_HOLD_MS = 4000
const START_DELAY_MS = 3000
const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'pointermove', 'scroll', 'touchstart'] as const

export const PrefetchKeeper = () => {
  const router = useRouter()

  useEffect(() => {
    let lastActive = Date.now()
    let ready = false

    const refresh = () => {
      if (!ready || document.visibilityState !== 'visible' || isPrefetchHeld()) return
      for (const href of keptHrefs(isEagerDevice())) prefetchFull(router, href)
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

    let idleHandle = 0
    let idleTimer = 0
    const begin = () => {
      ready = true
      refresh()
    }
    const start = () => {
      if (typeof window.requestIdleCallback !== 'function') {
        idleTimer = window.setTimeout(begin, START_DELAY_MS)
        return
      }
      idleHandle = window.requestIdleCallback(begin, { timeout: START_DELAY_MS })
    }
    if (document.readyState === 'complete') start()
    window.addEventListener('load', start, { once: true })

    return () => {
      window.removeEventListener('load', start)
      window.clearTimeout(idleTimer)
      if (idleHandle) window.cancelIdleCallback(idleHandle)
      window.clearInterval(timer)
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, wake, { capture: true })
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router])

  return null
}
