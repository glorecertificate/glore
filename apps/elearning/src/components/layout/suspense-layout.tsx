'use client'

import { Suspense } from 'react'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'

import { cn } from '@/lib/utils'

export interface SuspenseLayoutProps extends Partial<React.SuspenseProps>, React.HTMLAttributes<HTMLDivElement> {
  loader?: boolean
  size?: 'auto' | 'full'
}

export const SuspenseLayout = ({ className, fallback, loader = true, size, ...props }: SuspenseLayoutProps) => (
  <Suspense
    fallback={
      <div
        className={cn('flex items-center justify-center', size === 'full' && 'h-full min-h-svh pb-8', className)}
        {...props}
      >
        {/* {loader && <Spinner className={cn(size === 'full' ? 'w-5 md:w-7' : 'w-4 md:w-6')} colored />} */}
        {loader && (
          <DotLottieReact
            autoplay
            loop
            src="https://lottie.host/ca269b5b-1a65-4583-881b-fe853cb4a4cc/sJpRldalHn.lottie"
          />
        )}
        {fallback}
      </div>
    }
    {...props}
  />
)
