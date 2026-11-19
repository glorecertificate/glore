import { CourseListActions } from '@/components/features/courses/course-list/actions'
import { CourseListContent } from '@/components/features/courses/course-list/content'
import { CourseListDescription } from '@/components/features/courses/course-list/description'
import { CourseListTabs } from '@/components/features/courses/course-list/tabs'
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
    <CourseListContent />
  </DashboardPage>
)

export default CoursesPage
