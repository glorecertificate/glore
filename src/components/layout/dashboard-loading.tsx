import { DashboardPage } from '@/components/layout/dashboard-page'
import { type NavigationId } from '@/components/layout/navigation'
import { RouteLoading } from '@/components/layout/route-loading'

export const DashboardLoading = ({ parent, title }: { parent?: NavigationId; title?: React.ReactNode }) => (
  <DashboardPage className="flex-1" fallback={null} parent={parent} title={title}>
    <RouteLoading />
  </DashboardPage>
)
