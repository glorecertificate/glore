import { DashboardPage } from '@/components/layout/dashboard-page'
import { Skeleton } from '@/components/ui/skeleton'

const CARD_KEYS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']

const DashboardLoading = () => (
  <DashboardPage breadcrumb={<Skeleton className="h-5 w-36" />} fallback={null}>
    <div className="flex flex-col gap-6 pt-2">
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARD_KEYS.map(key => (
          <Skeleton className="h-40 rounded-xl" key={key} />
        ))}
      </div>
    </div>
  </DashboardPage>
)

export default DashboardLoading
