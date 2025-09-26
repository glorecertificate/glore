import { cn } from '@repo/ui/utils'

export const Video = ({ className, ...props }: React.ComponentProps<'video'>) => (
  <video className={cn('aspect-video w-full object-cover', className)} controls {...props} />
)
