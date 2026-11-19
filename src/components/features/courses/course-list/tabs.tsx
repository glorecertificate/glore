'use client'

import { CourseLanguagesProvider } from '@/components/features/courses/course-languages'
import { type CourseListTab } from '@/components/features/courses/course-list/params'
import { useCourseListParams, useCourseListTab } from '@/components/features/courses/course-list/use-params'
import { Tabs } from '@/components/ui/tabs'

export const CourseListTabs = ({ children, ...props }: React.ComponentProps<typeof Tabs>) => {
  const { tab, setTab } = useCourseListTab()
  useCourseListParams()

  return (
    <CourseLanguagesProvider>
      <Tabs
        animated
        className="gap-0"
        defaultValue="all"
        onValueChange={value => setTab(value as CourseListTab)}
        value={tab}
        {...props}
      >
        {children}
      </Tabs>
    </CourseLanguagesProvider>
  )
}
