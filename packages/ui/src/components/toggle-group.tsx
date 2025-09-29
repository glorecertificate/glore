'use client'

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type VariantProps } from 'class-variance-authority'
import { createContext, useContext } from 'react'

import { toggleVariants } from '@repo/ui/components/toggle'
import { cn } from '@repo/ui/utils'

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
})

export const ToggleGroup = ({
  children,
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) => (
  <ToggleGroupPrimitive.Root
    className={cn('group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs', className)}
    data-size={size}
    data-slot="toggle-group"
    data-variant={variant}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
)

export const ToggleGroupItem = ({
  children,
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) => {
  const context = useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        `
          min-w-0 flex-1 shrink-0 rounded-none shadow-none
          first:rounded-l-md
          last:rounded-r-md
          focus:z-10
          focus-visible:z-10
          data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l
        `,
        className,
      )}
      data-size={context.size || size}
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}
