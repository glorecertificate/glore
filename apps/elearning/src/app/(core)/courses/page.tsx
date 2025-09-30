import { CourseList } from '@/components/features/courses/course-list'
import { createMetadata } from '@/lib/metadata'
import { createCookieClient } from '@/lib/storage'

export const generateMetadata = createMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const { get } = await createCookieClient()
  const coursesLanguage = await get('course-locale')
  const languageFilter = await get('course-list-locales')
  const tab = await get('course-list-view')

  return <CourseList defaultCoursesLanguage={coursesLanguage} defaultLanguageFilter={languageFilter} defaultTab={tab} />
}
