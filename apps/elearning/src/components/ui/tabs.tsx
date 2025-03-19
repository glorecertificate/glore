'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const Tabs = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />
)

const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground',
      className,
    )}
    data-slot="tabs-list"
    {...props}
  />
)

const TabsTrigger = ({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTrigger>) => (
  <TabsPrimitive.Trigger className={cn(tabsTrigger({ className, variant }))} data-slot="tabs-trigger" {...props} />
)

const tabsTrigger = cva(
  [
    'inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground transition-shadow',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-1',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:pointer-events-none data-[state=active]:shadow-sm',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    'dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:text-foreground',
  ],
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: [
          'focus-visible:ring-ring/50 focus-visible:outline-ring',
          'data-[state=active]:bg-background dark:data-[state=active]:bg-input/30',
        ],
        primary: [
          'focus-visible:ring-primary/50 focus-visible:outline-primary',
          'data-[state=active]:border-primary-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary-accent',
        ],
        secondary: [
          'focus-visible:text-secondary-foreground focus-visible:ring-secondary/50 focus-visible:outline-secondary',
          'data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary-accent',
        ],
        tertiary: [
          'text-tertiary-foreground',
          'focus-visible:ring-tertiary/50 focus-visible:outline-tertiary',
          'data-[state=active]:bg-tertiary dark:data-[state=active]:bg-tertiary-accent',
        ],
      },
    },
  },
)

const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} data-slot="tabs-content" {...props} />
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
