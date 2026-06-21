'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

export const Switch = ({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors duration-300 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-secondary data-[state=unchecked]:bg-input motion-reduce:transition-none dark:data-[state=unchecked]:bg-input/80',
      className
    )}
    data-slot="switch"
    {...props}
  >
    <SwitchPrimitive.Thumb
      className="pointer-events-none block size-4.5 rounded-full bg-white ring-0 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0.5 motion-reduce:transition-none dark:data-[state=checked]:bg-brand-secondary-foreground dark:data-[state=unchecked]:bg-foreground"
      data-slot="switch-thumb"
    />
  </SwitchPrimitive.Root>
)
