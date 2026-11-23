import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { type NavigationId } from '@/components/layout/navigation'

export const DashboardLoading = ({ parent, title }: { parent?: NavigationId; title?: React.ReactNode }) => (
  <DashboardPage className="flex-1" fallback={null} parent={parent} title={title}>
    <LoadingFallback size="page" />
  </DashboardPage>
)
