import { CourseList } from '@/components/features/courses/course-list'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
import { CourseListToolbar } from '@/components/features/courses/course-list/toolbar'
import { SkillCompassSection } from '@/components/features/courses/skill-compass/section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { NavigationLabel } from '@/components/layout/navigation-label'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'courses',
})

const CoursesPage = () => (
  <DashboardPage provider={CourseListTabs} title={<NavigationLabel id="courses" />}>
    <CourseListToolbar />
    <SkillCompassSection />
    <CourseList />
  </DashboardPage>
)

export default CoursesPage
