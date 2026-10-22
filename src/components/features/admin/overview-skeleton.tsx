import { Skeleton } from '@/components/ui/skeleton'

const STATS = ['users', 'organizations', 'certificates', 'waiting']
const CHARTS = ['growth', 'certificates']
const PANELS = ['pipeline', 'review', 'shortcuts']

export const AdminOverviewSkeleton = () => (
  <div aria-busy className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map(id => (
        <Skeleton className="h-32 w-full" key={id} />
      ))}
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      {CHARTS.map(id => (
        <Skeleton className="h-96 w-full" key={id} />
      ))}
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      {PANELS.map(id => (
        <Skeleton className="h-64 w-full" key={id} />
      ))}
    </div>
  </div>
)
