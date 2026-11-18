import { Skeleton } from '@/components/ui/skeleton'

export const FieldSkeleton = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
  </div>
)
