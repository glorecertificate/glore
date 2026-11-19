import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { type NavigationId } from '@/components/layout/navigation'

export const DashboardLoading = ({ parent }: { parent?: NavigationId }) => (
  <DashboardPage fallback={null} parent={parent}>
    <LoadingFallback delay={false} />
  </DashboardPage>
)
