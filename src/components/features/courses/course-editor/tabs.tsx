'use client'

import { type Locale } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { Tabs } from '@/components/ui/tabs'

export const CourseEditorTabs = ({ children }: React.PropsWithChildren) => {
  const { language, setLanguage } = useCourse()

  return (
    <Tabs className="gap-0" onValueChange={value => setLanguage(value as Locale)} value={language}>
      {children}
    </Tabs>
  )
}
