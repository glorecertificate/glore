'use client'

import { resolvedDynamic } from '@/components/features/courses/course-editor/resolved-dynamic'
import { LoadingFallback } from '@/components/layout/loading-fallback'

const courseEditor = resolvedDynamic(
  async () => (await import('@/components/features/courses/course-editor')).CourseEditor,
  () => <LoadingFallback size="full" />
)

export const CourseEditor = courseEditor.Component

export const preloadCourseEditor = courseEditor.preload
