import { AppBreadcrumb } from '@/components/layout/app-breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

export default () => (
  <AppBreadcrumb>
    <Skeleton className="h-5 w-32" />
  </AppBreadcrumb>
)
