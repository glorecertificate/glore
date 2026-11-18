'use client'

import { CourseContent } from '@/components/features/courses/course-editor/content'
import { useCourse } from '@/components/features/courses/course-editor/context'
import { CourseFooter } from '@/components/features/courses/course-editor/footer'
import { CourseLessonPicker } from '@/components/features/courses/course-editor/lesson-picker'
import { CourseSidebar } from '@/components/features/courses/course-editor/sidebar'
import { useMetadata } from '@/hooks/use-metadata'
import { useNavigationGuard } from '@/hooks/use-navigation-guard'

const COURSE_SIDEBAR_WIDTH = '18rem'
const sidebarStyle = { width: COURSE_SIDEBAR_WIDTH }

export const CourseEditor = () => {
  const { course, hasAnyUpdates, language } = useCourse()
  const hasFooter = course.lessons && course.lessons.length > 1

  useMetadata({ title: course.title[language] })

  useNavigationGuard(hasAnyUpdates)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row">
        <CourseSidebar className="hidden shrink-0 md:block" style={sidebarStyle} />
        <div className="flex min-w-0 grow flex-col">
          <CourseLessonPicker className="mb-4 md:hidden" />
          <CourseContent />
          {hasFooter && <CourseFooter />}
        </div>
      </div>
    </div>
  )
}
