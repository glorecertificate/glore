'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { LucideIcon } from '@/components/icons/lucide'
import { cn } from '@/lib/utils'

export const RadioGroup = ({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) => (
  <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} data-slot="radio-group" {...props} />
)

export const RadioGroupItem = ({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) => (
  <RadioGroupPrimitive.Item
    className={cn(
      'aspect-square size-4 shrink-0 rounded-full border border-border-strong bg-field text-action shadow-xs transition-[color,border-color] duration-150 outline-none focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-action motion-reduce:transition-none',
      className
    )}
    data-slot="radio-group-item"
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      className="relative flex items-center justify-center"
      data-slot="radio-group-indicator"
    >
      <LucideIcon className="absolute top-1/2 left-1/2 size-2 -translate-1/2 fill-action" name="circle" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
)
