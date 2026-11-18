'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

import { LucideIcon } from '@/components/icons/lucide'
import { cn } from '@/lib/utils'

export const Checkbox = ({ checked, className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    checked={checked}
    className={cn(
      'peer size-4 shrink-0 rounded-sm border border-border-strong bg-field shadow-xs transition-[background-color,border-color] duration-150 outline-none focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground motion-reduce:transition-none',
      className
    )}
    data-slot="checkbox"
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className="flex items-center justify-center text-current transition-none"
      data-slot="checkbox-indicator"
    >
      <LucideIcon className="size-3.5" name={checked === 'indeterminate' ? 'minus' : 'check'} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
)
