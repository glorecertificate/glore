'use client'

import { type Locale } from 'next-intl'

import { CourseBreadcrumb } from '@/components/features/courses/course-breadcrumb'
import { CourseContent } from '@/components/features/courses/course-content'
import { CourseFooter } from '@/components/features/courses/course-footer'
import { CourseHeader, CourseHeaderMobile } from '@/components/features/courses/course-header'
import { CourseSidebar } from '@/components/features/courses/course-sidebar'
import { Tabs } from '@/components/ui/tabs'
import { useCourse } from '@/hooks/use-course'

export const CourseView = () => {
  const { course, language, setLanguage } = useCourse()
  const hasFooter = course.lessons && course.lessons.length > 1

  return (
    <>
      <CourseBreadcrumb />
      <Tabs className="pt-2" onValueChange={v => setLanguage(v as Locale)} value={language}>
        <CourseHeader />
        <div className="grid grow grid-cols-1 gap-2 pb-8 md:grid-cols-[minmax(208px,1fr)_3fr]">
          <CourseSidebar />
          <div className="flex w-full min-w-0 flex-col">
            <CourseHeaderMobile />
            <CourseContent />
            {hasFooter && <CourseFooter />}
          </div>
        </div>
      </Tabs>
    </>
  )
}
