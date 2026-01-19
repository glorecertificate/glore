'use client'

import { type Locale } from 'next-intl'

import { CourseContent } from '@/components/features/courses/course-content'
import { CourseFooter } from '@/components/features/courses/course-footer'
import { CourseHeader, CourseHeaderMobile } from '@/components/features/courses/course-header'
import { useCourse } from '@/components/features/courses/course-provider'
import { CourseSidebar } from '@/components/features/courses/course-sidebar'
import { Tabs } from '@/components/ui/tabs'
import { useMetadata } from '@/hooks/use-metadata'

const COURSE_SIDEBAR_WIDTH = '18rem'

export const CourseView = () => {
  const { course, language, setLanguage } = useCourse()
  const hasFooter = course.lessons && course.lessons.length > 1

  useMetadata({
    title: course.title[language],
  })

  return (
    <Tabs className="pt-2" onValueChange={v => setLanguage(v as Locale)} value={language}>
      <CourseHeader />
      <div className="flex flex-col gap-2 pb-8 md:flex-row">
        <CourseSidebar className="hidden md:block" style={{ width: COURSE_SIDEBAR_WIDTH }} />
        <div className="flex grow flex-col">
          <CourseHeaderMobile className="sticky top-18 md:hidden" />
          <CourseContent />
          {hasFooter && <CourseFooter />}
        </div>
      </div>
    </Tabs>
  )
}
