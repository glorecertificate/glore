'use client'

import { Suspense } from 'react'

import { Spinner } from '@/components/icons/spinner'
import { cn } from '@/lib/utils'

export interface SuspenseLoaderProps extends Partial<React.SuspenseProps>, React.HTMLAttributes<HTMLDivElement> {
  loader?: boolean
  size?: 'auto' | 'full'
}

export const SuspenseLoader = ({ className, fallback, loader = true, size, ...props }: SuspenseLoaderProps) => (
  <Suspense
    fallback={
      <div
        className={cn('flex items-center justify-center', size === 'full' && 'h-full min-h-svh pb-8', className)}
        {...props}
      >
        {loader && <Spinner className={cn(size === 'full' ? 'w-5 md:w-7' : 'w-4 md:w-6')} colored />}
        {fallback}
      </div>
    }
    {...props}
  />
)
