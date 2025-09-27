'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { CircleIcon } from 'lucide-react'

import { cn } from '@repo/ui/utils'

export interface RadioGroupProps extends RadioGroupPrimitive.RadioGroupProps {}

export const RadioGroup = ({ className, ...props }: RadioGroupProps) => (
  <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} data-slot="radio-group" {...props} />
)

export interface RadioGroupItemProps extends RadioGroupPrimitive.RadioGroupItemProps {}

export const RadioGroupItem = ({ className, ...props }: RadioGroupItemProps) => (
  <RadioGroupPrimitive.Item
    className={cn(
      `
        aspect-square size-4 shrink-0 rounded-full border border-input text-brand-secondary shadow-xs transition-[color,box-shadow]
        outline-none
        focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
        disabled:cursor-not-allowed disabled:opacity-50
        aria-invalid:border-destructive aria-invalid:ring-destructive/20
        dark:bg-input/30 dark:aria-invalid:ring-destructive/40
      `,
      className,
    )}
    data-slot="radio-group-item"
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      className="relative flex items-center justify-center"
      data-slot="radio-group-indicator"
    >
      <CircleIcon className="absolute top-1/2 left-1/2 size-2 -translate-1/2 fill-brand-secondary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
)
