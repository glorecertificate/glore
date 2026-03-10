'use client'

import { useMemo } from 'react'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Tabs = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />
)

export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn('inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted/50 p-0.5', className)}
    data-slot="tabs-list"
    {...props}
  />
)

export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} data-slot="tabs-content" {...props} />
)

export const TabsTrigger = ({
  badgeProps,
  children,
  className,
  count = 0,
  effect,
  showZero = false,
  size,
  variant,
  ...props
}: Omit<React.ComponentProps<typeof TabsPrimitive.Trigger>, keyof VariantProps<typeof tabsTriggerVariants>> &
  VariantProps<typeof tabsTriggerVariants> & {
    badgeProps?: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tabsTriggerBadgeVariants>
    count?: number
    showZero?: boolean
  }) => {
  const showCount = useMemo(() => count !== undefined && (showZero || count > 0), [count, showZero])
  const { size: badgeSize = size, variant: badgeVariant = variant, ...badgeRest } = badgeProps ?? {}

  return (
    <TabsPrimitive.Trigger
      className={cn(tabsTriggerVariants({ effect, size, variant }), className)}
      data-slot="tabs-trigger"
      {...props}
    >
      {showCount ? (
        <span className="flex items-center gap-1" {...badgeRest}>
          {children}
          <span className={cn(tabsTriggerBadgeVariants({ size: badgeSize, variant: badgeVariant }))}>{count}</span>
        </span>
      ) : (
        children
      )}
    </TabsPrimitive.Trigger>
  )
}

const tabsTriggerVariants = cva(
  `group/tabs-trigger inline-flex h-full flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent py-1 text-sm leading-0 whitespace-nowrap select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:pointer-events-none data-[state=active]:shadow-sm [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4`,
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      effect: {
        grayscale: 'data-[state=inactive]:grayscale-80 data-[state=inactive]:*:opacity-60',
        'text-stroke': 'font-normal data-[state=active]:text-stroke-0.5 data-[state=active]:text-stroke-foreground',
      },
      size: {
        sm: 'gap-1 px-3 text-sm',
        md: 'px-4 text-sm',
        lg: 'px-6 py-3 text-lg',
      },
      variant: {
        default: `border text-muted-foreground/90 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring data-[state=active]:bg-background data-[state=active]:text-foreground dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground`,
        brand: `focus-visible:text-brand-foreground focus-visible:ring-brand/50 focus-visible:outline-brand data-[state=active]:bg-brand dark:data-[state=active]:bg-brand-accent`,
        'brand-secondary': `focus-visible:ring-brand-secondary/50 focus-visible:outline-brand-secondary data-[state=active]:border-brand-secondary-accent data-[state=active]:bg-brand-secondary data-[state=active]:text-brand-secondary-foreground dark:data-[state=active]:bg-brand-secondary-accent`,
        'brand-tertiary': `text-brand-tertiary-foreground focus-visible:ring-brand-tertiary/50 focus-visible:outline-brand-tertiary data-[state=active]:bg-brand-tertiary dark:data-[state=active]:bg-brand-tertiary-accent`,
      },
    },
  }
)

export const tabsTriggerBadgeVariants = cva('text-stroke-0', {
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: 'text-[10px]',
      md: 'text-[11px]',
      lg: 'text-xs',
    },
    variant: {
      default: 'text-muted-foreground/50 group-data-[state=active]/tabs-trigger:text-muted-foreground',
      brand: 'bg-brand-secondary text-brand-foreground',
      'brand-secondary': 'bg-brand-secondary-accent text-brand-secondary-foreground',
      'brand-tertiary': 'bg-brand-tertiary-accent text-brand-tertiary-foreground',
      success: 'text-success-accent/50 group-data-[state=active]/tabs-trigger:text-success-accent',
      warning: 'text-warning-accent/50 group-data-[state=active]/tabs-trigger:text-warning-accent',
      destructive: 'text-destructive-accent/50 group-data-[state=active]/tabs-trigger:text-destructive-accent',
    },
  },
})
