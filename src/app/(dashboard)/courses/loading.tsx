import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { NavigationLabel } from '@/components/layout/navigation-label'

const CoursesLoadingPage = () => (
  <DashboardPage fallback={null} title={<NavigationLabel id="courses" />}>
    <LoadingFallback />
  </DashboardPage>
)

export default CoursesLoadingPage
