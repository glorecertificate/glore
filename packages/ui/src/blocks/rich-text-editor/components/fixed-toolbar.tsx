'use client'

import { usePlateState } from 'platejs/react'

import { Toolbar } from '@repo/ui/components/toolbar'
import { cn } from '@repo/ui/utils'

export const FixedToolbar = ({ className, ...props }: React.ComponentProps<typeof Toolbar>) => {
  const [readOnly] = usePlateState('readOnly')

  return (
    <Toolbar
      className={cn(
        `
          sticky top-0 left-0 scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border border-b-0 border-border
          bg-background/95 p-1 backdrop-blur-sm
          supports-backdrop-blur:bg-background/60
        `,
        readOnly && 'hidden',
        className,
      )}
      {...props}
    />
  )
}
