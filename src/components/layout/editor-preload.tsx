'use client'

import { useEffect } from 'react'

export const EditorPreload = () => {
  useEffect(() => {
    const load = () => {
      void import('@/components/ui/chart-renderer')
      void import('@/components/features/courses/course-editor')
      void import('@/components/features/courses/course-editor/lesson-editor')
      void import('@/components/ui/rich-text-editor/provider')
    }
    const handle = window.setTimeout(load, 1500)
    return () => window.clearTimeout(handle)
  }, [])

  return null
}
