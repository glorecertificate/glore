'use client'

import { createContext, use } from 'react'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { type VariantProps, cva } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/lib/utils'

const MotionList = motion.create(TabsPrimitive.List)
const MotionTrigger = motion.create(TabsPrimitive.Trigger)

const TABS_TRANSITION = {
  duration: 0.2,
  ease: 'easeOut',
} as const

const TabsContext = createContext(false)

export const Tabs = ({
  animated = false,
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  animated?: boolean
}) => (
  <TabsContext.Provider value={animated}>
    <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />
  </TabsContext.Provider>
)

export const TabsList = ({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof TabsPrimitive.List>,
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
>) => {
  const animated = use(TabsContext)
  const classNames = cn('inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted/55 p-0.5', className)
  if (!animated) return <TabsPrimitive.List className={classNames} data-slot="tabs-list" {...props} />
  return <MotionList className={classNames} data-slot="tabs-list" layout transition={TABS_TRANSITION} {...props} />
}

export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} data-slot="tabs-content" {...props} />
)

const tabsTriggerVariants = cva(
  [
    'group/tabs-trigger inline-flex h-full flex-1 items-center justify-center rounded-md border border-transparent leading-0 whitespace-nowrap text-muted-foreground/90 select-none disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring',
    'data-[state=active]:pointer-events-none data-[state=active]:bg-background data-[state=active]:text-foreground! data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
    '[&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  ],
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'gap-1 px-3 py-1 text-sm',
        md: 'px-4 py-1 text-sm',
        lg: 'px-6 py-3 text-lg',
      },
      effect: {
        grayscale: 'data-[state=inactive]:grayscale-80 data-[state=inactive]:*:opacity-60',
        'text-stroke': 'font-normal data-[state=active]:text-stroke',
      },
    },
  }
)

const tabsTriggerBadgeVariants = cva(
  'font-medium text-muted-foreground/50 text-stroke-0 group-data-[state=active]/tabs-trigger:text-muted-foreground',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        sm: 'text-[11.5px]',
        md: 'text-xs',
        lg: 'text-[13px]',
      },
    },
  }
)

export const TabsTrigger = ({
  children,
  className,
  count = 0,
  effect,
  showZero = false,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  React.ComponentProps<typeof MotionTrigger> &
  VariantProps<typeof tabsTriggerVariants> & {
    count?: number
    showZero?: boolean
  }) => {
  const animated = use(TabsContext)
  const showCount = count !== undefined && (showZero || count > 0)
  const triggerClassName = cn(tabsTriggerVariants({ effect, size }), className)
  const badgeClassName = cn(tabsTriggerBadgeVariants({ size }))

  if (!animated) {
    return (
      <TabsPrimitive.Trigger className={triggerClassName} data-slot="tabs-trigger" {...props}>
        {showCount ? (
          <span className="flex items-center gap-1.5">
            {children}
            <span className={badgeClassName}>{count}</span>
          </span>
        ) : (
          children
        )}
      </TabsPrimitive.Trigger>
    )
  }

  return (
    <MotionTrigger className={triggerClassName} data-slot="tabs-trigger" layout transition={TABS_TRANSITION} {...props}>
      <motion.span className="flex items-center gap-1.5" layout transition={TABS_TRANSITION}>
        {children}
        <AnimatePresence initial={false} mode="popLayout">
          {showCount ? (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              className={badgeClassName}
              exit={{ opacity: 0, scale: 0.5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              key="count"
              layout
              transition={TABS_TRANSITION}
            >
              {count}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.span>
    </MotionTrigger>
  )
}
