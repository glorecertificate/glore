import { cookies } from '@/actions/cookies'
import { CourseList } from '@/components/features/courses/course-list'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    title: 'Layout.courses',
  })

export default async () => {
  const { get } = await cookies()
  const coursesLanguage = await get('courses_language')
  const languageFilter = await get('course_list_language_filter')
  const groups = await get('course_list_groups')
  const tab = await get('course_list_tab')

  return (
    <CourseList
      defaultCourseLanguage={coursesLanguage}
      defaultGroups={groups}
      defaultLanguages={languageFilter}
      defaultTab={tab}
    />
  )
}
