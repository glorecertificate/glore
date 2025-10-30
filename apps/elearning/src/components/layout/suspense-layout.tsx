import { Suspense } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { Loader } from '@/components/icons/loader'
import { cn } from '@/lib/utils'

export interface SuspenseLayoutProps
  extends Partial<React.SuspenseProps>,
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof suspenseVariants> {
  loader?: boolean
}

export const SuspenseLayout = ({ className, fallback, loader = true, size, ...props }: SuspenseLayoutProps) => (
  <Suspense
    fallback={
      <div className={cn(suspenseVariants({ size }), className)} {...props}>
        {loader && <Loader className={loaderVariants({ size })} colored />}
        {fallback}
      </div>
    }
    {...props}
  />
)

const suspenseVariants = cva('flex size-full items-center justify-center', {
  variants: {
    size: {
      default: '',
      full: 'h-full min-h-svh',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

const loaderVariants = cva('', {
  variants: {
    size: {
      default: 'w-4 md:w-6',
      full: 'w-6 md:w-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})
