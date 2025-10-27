import { cva, type VariantProps } from 'class-variance-authority'

import { Loader } from '@/components/icons/loader'
import { cn } from '@/lib/utils'

export interface LoadingViewProps
  extends VariantProps<typeof loadingViewVariants>,
    React.HTMLAttributes<HTMLDivElement> {
  colored?: boolean
}

export const LoadingView = ({ className, colored = true, size, ...props }: LoadingViewProps) => (
  <div className={cn('flex size-full items-center justify-center', className)} {...props}>
    <Loader className={loadingViewVariants({ size })} colored={colored} />
  </div>
)

const loadingViewVariants = cva('', {
  variants: {
    size: {
      default: 'w-4 md:w-6',
      full: 'h-full min-h-svh w-6 md:w-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})
