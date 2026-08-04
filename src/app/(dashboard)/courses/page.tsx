import { redirect } from 'next/navigation'

import { getCookie } from '@/actions/cookies'
import { CourseList } from '@/components/features/courses/course-list'
import { CourseListHeader } from '@/components/features/courses/course-list/header'
import { CourseListSkeleton } from '@/components/features/courses/course-list/skeleton'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'courses',
})

const CoursesPageContent = async ({ searchParams }: { searchParams: PageProps<'/courses'>['searchParams'] }) => {
  if (Object.keys(await searchParams).length === 0) {
    const params = await getCookie('courseListParams')
    if (params) {
      redirect(`/courses?${params}`)
    }
  }

  return <CourseList className="pb-6" />
}

const CoursesPage = ({ searchParams }: PageProps<'/courses'>) => (
  <DashboardPage
    header={<CourseListHeader />}
    fallback={<CourseListSkeleton />}
    className="min-h-[calc(100vh-160px)]"
    provider={CourseListTabs}
  >
    <CoursesPageContent searchParams={searchParams} />
  </DashboardPage>
)

export default CoursesPage
