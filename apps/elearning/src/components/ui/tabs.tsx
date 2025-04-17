'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const Tabs = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />
)

const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn('inline-flex w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)}
    data-slot="tabs-list"
    {...props}
  />
)

const TabsTrigger = ({
  className,
  color,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTrigger>) => (
  <TabsPrimitive.Trigger className={cn(tabsTrigger({ className, color, size }))} data-slot="tabs-trigger" {...props} />
)

const tabsTrigger = cva(
  [
    'inline-flex h-full flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent py-1 text-sm whitespace-nowrap text-foreground',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-1',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:pointer-events-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    'dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:text-foreground',
  ],
  {
    defaultVariants: {
      color: 'default',
      size: 'default',
    },
    variants: {
      color: {
        default: [
          'text-muted-foreground focus-visible:ring-ring/50 focus-visible:outline-ring',
          'data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
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
      size: {
        default: 'px-2 text-[11.5px] md:px-4 md:text-sm',
        sm: 'px-4 text-sm',
        lg: 'px-6 py-3 text-lg',
      },
    },
  },
)

const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} data-slot="tabs-content" {...props} />
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
