import { cookies } from '@/actions/cookies'
import { CourseList } from '@/components/features/courses/course-list'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'courses',
  })

export default async () => {
  const { get } = await cookies()
  const [courseLanguage, languages, groups, tab] = await Promise.all([
    get('courseLanguage'),
    get('courseListLanguage'),
    get('courseListGroups'),
    get('courseListTab'),
  ])

  return (
    <>
      <PageHeader />
      <PageMain>
        <CourseList
          defaultCourseLanguage={courseLanguage}
          defaultGroups={groups}
          defaultLanguages={languages}
          defaultTab={tab}
        />
      </PageMain>
    </>
  )
}
