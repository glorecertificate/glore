import { Skeleton } from '@/components/ui/skeleton'

export const FilterSkeleton = ({ selects }: { selects: number }) => (
  <div className="flex w-full flex-wrap items-center gap-2">
    <Skeleton className="h-8 w-full sm:w-64" />
    {Array.from({ length: selects }, (_, index) => (
      <Skeleton className="h-8 w-28" key={index} />
    ))}
  </div>
)
