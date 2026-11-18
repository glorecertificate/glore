'use client'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { localizeRecord } from '@/lib/i18n'

export const CourseBarTitle = () => {
  const { course, language } = useCourse()

  return localizeRecord(course.title, language)
}
