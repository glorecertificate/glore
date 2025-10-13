import { cn } from '@/lib/utils'

export const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('animate-pulse rounded-md bg-brand-secondary/10', className)} data-slot="skeleton" {...props} />
)
