import { cn } from '@/lib/utils'

export const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('animate-pulse rounded-md bg-muted/50', className)} data-slot="skeleton" {...props} />
)

export const SkeletonText = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('animate-pulse rounded-sm bg-muted/50 box-decoration-clone text-transparent select-none', className)}
    data-slot="skeleton-text"
    {...props}
  />
)
