'use client'

import { CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Root, Item, Indicator } from '@radix-ui/react-radio-group'
import type * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

export type RadioGroupProps = RadioGroupPrimitive.RadioGroupProps
export type RadioGroupItemProps = RadioGroupPrimitive.RadioGroupItemProps

export const RadioGroup = ({ className, ...props }: RadioGroupProps) => (
  <Root className={cn('grid gap-3', className)} data-slot="radio-group" {...props} />
)

export const RadioGroupItem = ({ className, ...props }: RadioGroupItemProps) => (
  <Item
    className={cn(
      'aspect-square size-4 shrink-0 rounded-full border border-input text-brand-secondary shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
      className
    )}
    data-slot="radio-group-item"
    {...props}
  >
    <Indicator className="relative flex items-center justify-center" data-slot="radio-group-indicator">
      <CircleIcon className="-translate-1/2 absolute top-1/2 left-1/2 size-2 fill-brand-secondary" />
    </Indicator>
  </Item>
)
