'use client'

import { createContext, useContext } from 'react'

import { Toggle as TogglePrimitive, type ToggleProps } from '@radix-ui/react-toggle'
import {
  Item,
  type ToggleGroupItemProps,
  ToggleGroup as ToggleGroupPrimitive,
  type ToggleGroupSingleProps,
} from '@radix-ui/react-toggle-group'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Toggle = ({ className, size, variant, ...props }: ToggleProps & VariantProps<typeof toggleVariants>) => (
  <TogglePrimitive className={cn(toggleVariants({ variant, size, className }))} data-slot="toggle" {...props} />
)

export const toggleVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow]
    outline-none
    hover:bg-muted hover:text-muted-foreground
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    data-[state=on]:bg-accent data-[state=on]:text-accent-foreground
    dark:aria-invalid:ring-destructive/40
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 min-w-9 px-2',
        sm: 'h-8 min-w-8 px-1.5',
        lg: 'h-10 min-w-10 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

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
}: ToggleGroupSingleProps & VariantProps<typeof toggleVariants>) => (
  <ToggleGroupPrimitive
    className={cn('group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs', className)}
    data-size={size}
    data-slot="toggle-group"
    data-variant={variant}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive>
)

export const ToggleGroupItem = ({
  children,
  className,
  size,
  variant,
  ...props
}: ToggleGroupItemProps & VariantProps<typeof toggleVariants>) => {
  const context = useContext(ToggleGroupContext)

  return (
    <Item
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
        className
      )}
      data-size={context.size || size}
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      {...props}
    >
      {children}
    </Item>
  )
}
