'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'

export const SegmentedControl = ({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) => (
  <RadioGroupPrimitive.Root
    className={cn('inline-flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1', className)}
    data-slot="segmented-control"
    {...props}
  />
)
