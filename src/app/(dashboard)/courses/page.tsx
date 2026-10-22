import { Suspense } from 'react'

import { CourseList } from '@/components/features/courses/course-list'
import { CourseListHeader } from '@/components/features/courses/course-list/header'
import { CourseListSkeleton } from '@/components/features/courses/course-list/skeleton'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
import { SkillCompassSection } from '@/components/features/courses/skill-compass/section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'courses',
})

const CoursesPage = () => (
  <DashboardPage
    header={<CourseListHeader />}
    fallback={<CourseListSkeleton />}
    className="min-h-[calc(100vh-160px)]"
    provider={CourseListTabs}
  >
    <Suspense fallback={null}>
      <SkillCompassSection />
    </Suspense>
    <CourseList className="pb-6" />
  </DashboardPage>
)

export default CoursesPage
