import { redirect } from 'next/navigation'

import { getCookie } from '@/actions/cookies'
import { CourseList } from '@/components/features/courses/course-list'
import { CourseListHeader } from '@/components/features/courses/course-list/header'
import { CourseListSkeleton } from '@/components/features/courses/course-list/skeleton'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'courses',
  })

const CoursesPage = async ({ searchParams }: PageProps<'/courses'>) => {
  if (Object.keys(await searchParams).length === 0) {
    const params = await getCookie('courseListParams')
    if (params) {
      redirect(`/courses?${params}`)
    }
  }

  return (
    <DashboardPage
      header={<CourseListHeader />}
      fallback={<CourseListSkeleton />}
      className="min-h-[calc(100vh-160px)]"
      provider={CourseListTabs}
    >
      <CourseList className="pb-6" />
    </DashboardPage>
  )
}

export default CoursesPage
