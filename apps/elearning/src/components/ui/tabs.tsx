'use client'

import { useMemo } from 'react'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {}

export const Tabs = ({ className, ...props }: TabsProps) => (
  <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />
)

export interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {}

export const TabsList = ({ className, ...props }: TabsListProps) => (
  <TabsPrimitive.List
    className={cn(
      'inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted/50 p-0.5 text-muted-foreground',
      className,
    )}
    data-slot="tabs-list"
    {...props}
  />
)

export interface TabsTriggerProps
  extends Omit<React.ComponentProps<typeof TabsPrimitive.Trigger>, 'color'>,
    VariantProps<typeof tabsTrigger> {
  count?: number
  showZeroCount?: boolean
}

export const TabsTrigger = ({
  children,
  className,
  color,
  count = 0,
  showZeroCount = false,
  size,
  ...props
}: TabsTriggerProps) => {
  const showCount = useMemo(() => count !== undefined && (showZeroCount || count > 0), [count, showZeroCount])

  return (
    <TabsPrimitive.Trigger className={cn(tabsTrigger({ color, size }), className)} data-slot="tabs-trigger" {...props}>
      {showCount ? (
        <span className="flex items-center gap-1">
          {children}
          <span className={cn(tabsTriggerBadge({ color, size }))}>{count}</span>
        </span>
      ) : (
        children
      )}
    </TabsPrimitive.Trigger>
  )
}

export const tabsTrigger = cva(
  `
    group/tabs-trigger inline-flex h-full flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent py-1 text-sm whitespace-nowrap
    text-foreground
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-1
    disabled:pointer-events-none disabled:opacity-50
    data-[state=active]:pointer-events-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow
    data-[state=active]:text-stroke-0.25 data-[state=active]:text-stroke-foreground
    dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:text-foreground
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*="size-"])]:size-4
  `,
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: `
          text-muted-foreground
          focus-visible:ring-ring/50 focus-visible:outline-ring
          data-[state=active]:bg-background
          dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground
        `,
        brand: `
          focus-visible:text-brand-foreground focus-visible:ring-brand/50 focus-visible:outline-brand
          data-[state=active]:bg-brand
          dark:data-[state=active]:bg-brand-accent
        `,
        'brand-secondary': `
          focus-visible:ring-brand-secondary/50 focus-visible:outline-brand-secondary
          data-[state=active]:border-brand-secondary-accent data-[state=active]:bg-brand-secondary data-[state=active]:text-brand-secondary-foreground
          dark:data-[state=active]:bg-brand-secondary-accent
        `,
        'brand-tertiary': `
          text-brand-tertiary-foreground
          focus-visible:ring-brand-tertiary/50 focus-visible:outline-brand-tertiary
          data-[state=active]:bg-brand-tertiary
          dark:data-[state=active]:bg-brand-tertiary-accent
        `,
      },
      size: {
        sm: 'px-4 text-sm',
        md: 'px-4 text-sm',
        lg: 'px-6 py-3 text-lg',
      },
    },
  },
)

export const tabsTriggerBadge = cva(
  'flex items-center justify-center rounded-full text-stroke-0 group-data-[state=active]/tabs-trigger:font-semibold',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: `
          bg-muted-foreground/15 text-muted-foreground/75
          group-data-[state=active]/tabs-trigger:bg-muted-foreground/80 group-data-[state=active]/tabs-trigger:text-accent
          dark:group-data-[state=active]/tabs-trigger:bg-muted-foreground/35 dark:group-data-[state=active]/tabs-trigger:text-foreground
          dark:group-data-[state=active]/tabs-trigger:text-shadow-lg
        `,
        brand: 'bg-brand text-brand-foreground',
        'brand-secondary': 'bg-brand-secondary text-brand-secondary-foreground',
        'brand-tertiary': 'bg-brand-tertiary text-brand-tertiary-foreground',
      },
      size: {
        sm: 'text-[9px]',
        md: 'min-w-[15px] text-[10.5px]',
        lg: 'text-sm',
      },
    },
  },
)

export interface TabsContentProps extends React.ComponentProps<typeof TabsPrimitive.Content> {}

export const TabsContent = ({ className, ...props }: TabsContentProps) => (
  <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} data-slot="tabs-content" {...props} />
)
