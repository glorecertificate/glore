import { CourseList } from '@/components/features/courses/course-list'
import { CourseListActions } from '@/components/features/courses/course-list/actions'
import { CourseListDescription } from '@/components/features/courses/course-list/description'
import { CourseListTabs, CourseListTabsList } from '@/components/features/courses/course-list/tabs'
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
  <DashboardPage
    actions={<CourseListActions />}
    breadcrumb={<CourseListTabsList />}
    description={<CourseListDescription />}
    provider={CourseListTabs}
    title={<NavigationLabel id="courses" />}
  >
    <CourseListToolbar />
    <SkillCompassSection />
    <CourseList />
  </DashboardPage>
)

export default CoursesPage
