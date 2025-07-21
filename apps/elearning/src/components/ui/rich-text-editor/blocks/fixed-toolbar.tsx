'use client'

import { cn } from '@/lib/utils'
import { Toolbar } from '#rte/blocks/toolbar'

export const FixedToolbar = (props: React.ComponentProps<typeof Toolbar>) => (
  <Toolbar
    {...props}
    className={cn(
      `
        sticky top-0 left-0 z-50 scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border border-b-0 border-border bg-background/95 p-1
        backdrop-blur-sm
        supports-backdrop-blur:bg-background/60
      `,
      props.className,
    )}
  />
)
