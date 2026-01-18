import { cookies } from '@/actions/cookies'
import { CourseList } from '@/components/features/courses/course-list'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'courses',
  })

export default async () => {
  const { get } = await cookies()
  const coursesLanguage = await get('courseLanguage')
  const languageFilter = await get('courseListLanguage')
  const groups = await get('courseListGroups')
  const tab = await get('courseListTab')

  return (
    <CourseList
      defaultCourseLanguage={coursesLanguage}
      defaultGroups={groups}
      defaultLanguages={languageFilter}
      defaultTab={tab}
    />
  )
}
