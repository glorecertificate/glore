'use client'

import { useEffect } from 'react'

interface NetworkInformation {
  effectiveType?: string
  saveData?: boolean
}

const PRELOAD_DELAY_MS = 2000
const INTENT_EVENTS = ['focusin', 'pointerdown', 'touchstart'] as const
const EDITOR_PATH = /^\/courses\/(?!skills(?:\/|$))[^/]+/u
const CHART_PATH = /^\/(?:admin|dashboard|organization)(?:\/|$)/u

const isConstrainedDevice = () => {
  const { connection } = navigator as Navigator & { connection?: NetworkInformation }
  if (window.matchMedia('(pointer: coarse)').matches) return true
  if (connection?.saveData) return true
  return connection?.effectiveType !== undefined && connection.effectiveType !== '4g'
}

const loadChart = () => void import('@/components/ui/chart-renderer')

const loadEditors = async () => {
  const [{ preloadCourseEditor }, { preloadLessonEditor }] = await Promise.all([
    import('@/components/features/courses/course-editor/lazy'),
    import('@/components/features/courses/course-editor/content'),
  ])
  await Promise.all([preloadCourseEditor(), preloadLessonEditor()])
}

export const EditorPreload = () => {
  useEffect(() => {
    if (!isConstrainedDevice()) {
      const handle = window.setTimeout(() => {
        loadChart()
        void loadEditors()
      }, PRELOAD_DELAY_MS)
      return () => window.clearTimeout(handle)
    }

    const onIntent = (event: Event) => {
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!anchor) return
      const { pathname } = new URL(anchor.href, window.location.href)
      if (EDITOR_PATH.test(pathname)) void loadEditors()
      if (CHART_PATH.test(pathname)) loadChart()
    }

    for (const type of INTENT_EVENTS) document.addEventListener(type, onIntent, { capture: true, passive: true })
    return () => {
      for (const type of INTENT_EVENTS) document.removeEventListener(type, onIntent, { capture: true })
    }
  }, [])

  return null
}
