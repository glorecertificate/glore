import { CourseList } from '@/components/features/courses/course-list'
import { createMetadata } from '@/lib/metadata'
import { getCookie } from '@/lib/storage/ssr'

export const generateMetadata = createMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const coursesLanguage = await getCookie('course-locale')
  const languageFilter = await getCookie('course-list-locales')
  const tab = await getCookie('course-list-view')

  return <CourseList defaultCoursesLanguage={coursesLanguage} defaultLanguageFilter={languageFilter} defaultTab={tab} />
}
