'use client'

import { useCallback, useEffect } from 'react'

import { type Locale } from 'next-intl'

import { CourseContent } from '@/components/features/courses/editor/content'
import { useCourse } from '@/components/features/courses/editor/context'
import { CourseFooter } from '@/components/features/courses/editor/footer'
import { CourseHeader, CourseHeaderMobile } from '@/components/features/courses/editor/header'
import { CourseSidebar } from '@/components/features/courses/editor/sidebar'
import { Tabs } from '@/components/ui/tabs'
import { useMetadata } from '@/hooks/use-metadata'

const COURSE_SIDEBAR_WIDTH = '18rem'
const sidebarStyle = { width: COURSE_SIDEBAR_WIDTH }

export const CourseView = () => {
  const { course, hasAnyUpdates, language, setLanguage } = useCourse()
  const hasFooter = course.lessons && course.lessons.length > 1

  useMetadata({
    title: course.title[language],
  })

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (hasAnyUpdates) {
        e.preventDefault()
      }
    },
    [hasAnyUpdates]
  )

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [handleBeforeUnload])

  return (
    <Tabs className="pt-2" onValueChange={value => setLanguage(value as Locale)} value={language}>
      <CourseHeader />
      <div className="flex flex-col gap-2 pb-8 md:flex-row">
        <CourseSidebar className="hidden md:block" style={sidebarStyle} />
        <div className="flex grow flex-col">
          <CourseHeaderMobile className="sticky top-18 md:hidden" />
          <CourseContent />
          {hasFooter && <CourseFooter />}
        </div>
      </div>
    </Tabs>
  )
}
