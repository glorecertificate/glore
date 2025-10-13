'use client'

import { Separator as SeparatorPrimitive, type SeparatorProps } from '@radix-ui/react-separator'

import { cn } from '@/lib/utils'

export const Separator = ({ className, decorative = true, orientation = 'horizontal', ...props }: SeparatorProps) => (
  <SeparatorPrimitive
    className={cn(
      'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
      className
    )}
    data-slot="separator-root"
    decorative={decorative}
    orientation={orientation}
    {...props}
  />
)
