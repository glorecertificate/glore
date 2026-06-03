'use client'

import { type Locale } from 'next-intl'

import { CourseContent } from '@/components/features/courses/course-editor/content'
import { useCourse } from '@/components/features/courses/course-editor/context'
import { CourseFooter } from '@/components/features/courses/course-editor/footer'
import { CourseHeader, CourseHeaderMobile } from '@/components/features/courses/course-editor/header'
import { CourseSidebar } from '@/components/features/courses/course-editor/sidebar'
import { Tabs } from '@/components/ui/tabs'
import { useMetadata } from '@/hooks/use-metadata'
import { useNavigationGuard } from '@/hooks/use-navigation-guard'

const COURSE_SIDEBAR_WIDTH = '18rem'
const sidebarStyle = { width: COURSE_SIDEBAR_WIDTH }

export const CourseEditor = () => {
  const { course, hasAnyUpdates, language, setLanguage } = useCourse()
  const hasFooter = course.lessons && course.lessons.length > 1

  useMetadata({ title: course.title[language] })

  useNavigationGuard(hasAnyUpdates)

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
