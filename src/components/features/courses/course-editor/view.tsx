import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { getLocale } from 'next-intl/server'

import { loadCourse } from '@/actions/courses/course-data'
import { CourseProvider } from '@/components/features/courses/course-editor/context'
import { CourseHeader } from '@/components/features/courses/course-editor/header'
import { CourseEditor } from '@/components/features/courses/course-editor/lazy'
import { CourseEditorTabs } from '@/components/features/courses/course-editor/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'

const resolveEditorData = async (slug: string) => {
  const [{ data: course, error }, language] = await Promise.all([loadCourse(slug), getLocale()])
  if (error) return notFound()
  return { course, language, step: 1 }
}

export const CourseEditorView = async ({ slug }: { slug: string }) => {
  const { course, language, step } = await resolveEditorData(slug)

  return (
    <CourseProvider value={{ course, language, step }}>
      <DashboardPage header={<CourseHeader />} provider={CourseEditorTabs}>
        <ViewTransition default="none" enter={{ 'course-created': 'grid-enter', default: 'none' }}>
          <CourseEditor />
        </ViewTransition>
      </DashboardPage>
    </CourseProvider>
  )
}
