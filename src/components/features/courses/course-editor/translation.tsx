'use client'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { TranslationPopover } from '@/components/features/translations/popover'

export const CourseTranslation = () => {
  const { course, hasAnyUpdates, language, saveVersion } = useCourse()

  return (
    <TranslationPopover
      disabled={hasAnyUpdates}
      entityId={course.id}
      entityType="course"
      locale={language}
      version={saveVersion}
    />
  )
}
