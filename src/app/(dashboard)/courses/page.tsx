import { CourseList } from '@/components/features/courses/course-list'
import { CourseListHeader } from '@/components/features/courses/course-list/header'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
import { SkillCompassSection } from '@/components/features/courses/skill-compass/section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'courses',
})

const CoursesPage = () => (
  <DashboardPage className="min-h-[calc(100vh-160px)]" header={<CourseListHeader />} provider={CourseListTabs}>
    <SkillCompassSection />
    <CourseList />
  </DashboardPage>
)

export default CoursesPage
