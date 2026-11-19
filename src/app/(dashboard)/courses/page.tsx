import { CourseListActions } from '@/components/features/courses/course-list/actions'
import { CourseListDescription } from '@/components/features/courses/course-list/description'
import { CourseListSection } from '@/components/features/courses/course-list/section'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
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
    description={<CourseListDescription />}
    provider={CourseListTabs}
    title={<NavigationLabel id="courses" />}
  >
    <SkillCompassSection />
    <CourseListSection />
  </DashboardPage>
)

export default CoursesPage
