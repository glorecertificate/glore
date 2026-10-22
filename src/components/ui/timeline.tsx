import { cn } from '@/lib/utils'

export const Timeline = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ol className={cn('flex flex-col', className)} data-slot="timeline" {...props} />
)
