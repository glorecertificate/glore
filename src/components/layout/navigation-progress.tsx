'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { leavesPage, navigationProgress } from '@/lib/navigation-progress'

const SHOW_DELAY = 150
const MIN_VISIBLE = 300
const TRICKLE_INTERVAL = 200
const FADE = 400
const START = 25
const COMMIT = 70
const CEILING = 90

export const NavigationProgress = () => {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    navigationProgress.commit()
  }, [pathname])

  useEffect(() => {
    const bar = ref.current
    if (!bar) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let value = 0
    let shownAt = 0
    let showTimer: ReturnType<typeof setTimeout> | undefined
    let finishTimer: ReturnType<typeof setTimeout> | undefined
    let trickleTimer: ReturnType<typeof setInterval> | undefined

    const paint = () => {
      bar.style.transform = `scaleX(${reduced.matches ? 1 : value / 100})`
    }

    const trickle = () => {
      value += (CEILING - value) * 0.08
      paint()
    }

    const run = () => {
      bar.dataset.state = 'active'
      clearInterval(trickleTimer)
      trickleTimer = setInterval(trickle, TRICKLE_INTERVAL)
      paint()
    }

    const show = () => {
      showTimer = undefined
      if (!navigationProgress.active()) return
      shownAt = performance.now()
      value = Math.max(value, START)
      run()
    }

    const finish = () => {
      clearInterval(trickleTimer)
      value = 100
      paint()
      bar.dataset.state = 'done'
      finishTimer = setTimeout(() => {
        bar.dataset.state = 'idle'
        value = 0
        shownAt = 0
        paint()
      }, FADE)
    }

    const update = (event: 'change' | 'commit') => {
      if (event === 'commit' && shownAt) {
        value = Math.max(value, COMMIT)
        paint()
      }
      if (navigationProgress.active()) {
        clearTimeout(finishTimer)
        if (shownAt && bar.dataset.state !== 'active') run()
        if (!shownAt && !showTimer) showTimer = setTimeout(show, SHOW_DELAY)
        return
      }
      clearTimeout(showTimer)
      showTimer = undefined
      if (!shownAt || bar.dataset.state !== 'active') return
      clearTimeout(finishTimer)
      finishTimer = setTimeout(finish, Math.max(0, MIN_VISIBLE - (performance.now() - shownAt)))
    }

    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(anchor instanceof HTMLAnchorElement)) return
      const link = { download: anchor.hasAttribute('download'), href: anchor.href, target: anchor.target }
      if (leavesPage(event, link, window.location)) navigationProgress.begin()
    }

    const unsubscribe = navigationProgress.subscribe(update)
    document.addEventListener('click', onClick, true)
    update('change')
    return () => {
      unsubscribe()
      document.removeEventListener('click', onClick, true)
      clearTimeout(showTimer)
      clearTimeout(finishTimer)
      clearInterval(trickleTimer)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 progress-bar z-60 h-0.75 bg-brand-secondary opacity-0 data-[state=active]:opacity-100"
      data-slot="navigation-progress"
      data-state="idle"
      ref={ref}
      style={{ transform: 'scaleX(0)' }}
    />
  )
}
