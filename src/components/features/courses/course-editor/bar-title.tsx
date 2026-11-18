'use client'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'

export const CourseBarTitle = () => {
  const { course, language } = useCourse()

  return localizeRecord(course.title, language) || localizeRecord(course.title, DEFAULT_LOCALE)
}
