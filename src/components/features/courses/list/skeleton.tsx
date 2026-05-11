import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const CourseCardSkeleton = () => (
  <div className="flex min-h-80 flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs">
    <div className="flex items-center justify-between">
      <Skeleton className="size-5 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <div className="space-y-2 pt-1">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="flex items-center gap-1 pt-1">
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-5 w-18 rounded-full" />
    </div>
    <div className="space-y-1.5 pt-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
    <div className="mt-auto flex flex-col gap-2.5 pt-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
    <div className="flex items-center gap-2 pt-2">
      <Skeleton className="h-9 flex-1 rounded-md" />
      <Skeleton className="size-9 rounded-md" />
    </div>
  </div>
)

export const CourseListSkeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex cursor-wait flex-col', className)} {...props}>
    <header className="sticky top-0 z-5 ml-px flex min-h-12 w-full shrink-0 flex-col gap-3 bg-linear-to-tr from-background to-background/90 p-4">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="mr-6 flex items-center gap-3">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <Skeleton className="mr-1 h-6 w-18" />
      </div>
      <div className="mt-2 mb-1 flex w-full justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </header>
    <main className="mx-auto flex size-full min-h-[calc(100vh-136px)] max-w-380 flex-col px-8">
      <div className="grid gap-6 pt-4 pb-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'] as const).map(id => (
          <CourseCardSkeleton key={id} />
        ))}
      </div>
    </main>
  </div>
)
