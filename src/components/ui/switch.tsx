'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors duration-150 ease-out outline-none focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:bg-action data-[state=unchecked]:bg-border-strong motion-reduce:transition-none',
  {
    defaultVariants: { size: 'md' },
    variants: {
      size: {
        sm: 'h-4 w-7 [&_[data-slot=switch-thumb]]:size-3 [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-3',
        md: 'h-5 w-9 [&_[data-slot=switch-thumb]]:size-4 [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-4',
      },
    },
  }
)

export const Switch = ({
  className,
  size,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & VariantProps<typeof switchVariants>) => (
  <SwitchPrimitive.Root className={cn(switchVariants({ size }), className)} data-slot="switch" {...props}>
    <SwitchPrimitive.Thumb
      className="pointer-events-none block translate-x-0 rounded-full bg-white shadow-xs transition-transform duration-150 ease-out motion-reduce:transition-none"
      data-slot="switch-thumb"
    />
  </SwitchPrimitive.Root>
)
