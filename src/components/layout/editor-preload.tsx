'use client'

import { useEffect } from 'react'

import { preloadLessonEditor } from '@/components/features/courses/course-editor/content'
import { preloadCourseEditor } from '@/components/features/courses/course-editor/lazy'

export const EditorPreload = () => {
  useEffect(() => {
    const load = () => {
      void import('@/components/ui/chart-renderer')
      void preloadCourseEditor()
      void preloadLessonEditor()
    }
    const handle = window.setTimeout(load, 1500)
    return () => window.clearTimeout(handle)
  }, [])

  return null
}
