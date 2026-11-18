'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'

export const SegmentedControlItem = ({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) => (
  <RadioGroupPrimitive.Item
    className={cn(
      'inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-[color,background-color,box-shadow] outline-none hover:text-foreground focus-visible:focus-ring-inset disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-xs motion-reduce:transition-none dark:data-[state=checked]:bg-surface-selected',
      className
    )}
    data-slot="segmented-control-item"
    {...props}
  />
)
