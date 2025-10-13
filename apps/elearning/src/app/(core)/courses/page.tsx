import { Suspense, use } from 'react'

import { CourseList } from '@/components/features/courses/course-list'
import { createMetadata } from '@/lib/metadata'
import { serverCookies } from '@/lib/storage/server'

export const metadata = createMetadata({
  title: 'courses',
})

const resolveCoursePageDefaults = async () => {
  const { get } = await serverCookies()

  return {
    coursesLanguage: get('course-locale'),
    languageFilter: get('course-list-locales'),
    tab: get('course-list-view'),
  }
}

const CoursesPageContent = () => {
  const { coursesLanguage, languageFilter, tab } = use(resolveCoursePageDefaults())

  return <CourseList defaultCoursesLanguage={coursesLanguage} defaultLanguageFilter={languageFilter} defaultTab={tab} />
}

export default () => (
  <Suspense fallback={null}>
    <CoursesPageContent />
  </Suspense>
)
