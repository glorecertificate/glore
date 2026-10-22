'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'

export const SegmentedControlItem = ({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) => (
  <RadioGroupPrimitive.Item
    className={cn(
      'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-[color,background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-xs motion-reduce:transition-none',
      className
    )}
    data-slot="segmented-control-item"
    {...props}
  />
)
