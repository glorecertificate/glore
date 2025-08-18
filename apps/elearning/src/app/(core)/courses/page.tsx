import { CourseList } from '@/components/features/courses/course-list'
import { createMetadata } from '@/lib/metadata'
import { getCookie } from '@/lib/storage/server'

export const generateMetadata = createMetadata({
  title: 'Navigation.courses',
})

export default async () => {
  const coursesLanguage = await getCookie('courses-language')
  const languageFilter = await getCookie('courses-language-filter')
  const tab = await getCookie('course-tab')

  return <CourseList defaultCoursesLanguage={coursesLanguage} defaultLanguageFilter={languageFilter} defaultTab={tab} />
}
