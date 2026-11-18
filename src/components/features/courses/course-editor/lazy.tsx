'use client'

import dynamic from 'next/dynamic'

import { LoadingFallback } from '@/components/layout/loading-fallback'

export const CourseEditor = dynamic(
  async () => (await import('@/components/features/courses/course-editor')).CourseEditor,
  {
    loading: () => <LoadingFallback size="full" />,
    ssr: false,
  }
)
