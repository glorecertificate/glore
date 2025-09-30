'use client'

import { usePlateState } from 'platejs/react'

import { Toolbar } from '@/components/ui/toolbar'
import { cn } from '@/lib/utils'

export const FixedToolbar = ({ className, ...props }: React.ComponentProps<typeof Toolbar>) => {
  const [readOnly] = usePlateState('readOnly')

  return (
    <Toolbar
      className={cn(
        'scrollbar-hide sticky top-0 left-0 w-full justify-between overflow-x-auto rounded-t-lg border border-border border-b-0 bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        readOnly && 'hidden',
        className
      )}
      {...props}
    />
  )
}
