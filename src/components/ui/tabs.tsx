'use client'

import { createContext, use } from 'react'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { type VariantProps, cva } from 'class-variance-authority'
import { AnimatePresence, m } from 'motion/react'

import { MotionFeatures } from '@/components/ui/motion-features'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { scrollEdgesMask, useScrollEdges } from '@/hooks/use-scroll-edges'
import { cn } from '@/lib/utils'

const MotionList = m.create(TabsPrimitive.List)
const MotionTrigger = m.create(TabsPrimitive.Trigger)

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
  <MotionFeatures>
    <TabsContext.Provider value={animated}>
      <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} data-slot="tabs" {...props} />
    </TabsContext.Provider>
  </MotionFeatures>
)

export const TabsList = ({
  className,
  ref: forwardedRef,
  style,
  ...props
}: Omit<
  React.ComponentProps<typeof TabsPrimitive.List>,
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
>) => {
  const animated = use(TabsContext)
  const { end, ref, scrollable, start } = useScrollEdges<HTMLDivElement>()
  const composedRef = useComposedRefs(forwardedRef, ref)
  const maskImage = scrollEdgesMask({ end, start })
  const classNames = cn(
    'inline-flex h-9 w-fit max-w-full scrollbar-none items-center justify-center rounded-lg bg-muted/55 p-0.5',
    scrollable && 'justify-start overflow-x-auto',
    className
  )
  const listStyle = { ...style, maskImage, WebkitMaskImage: maskImage }
  if (!animated) {
    return (
      <TabsPrimitive.List className={classNames} data-slot="tabs-list" ref={composedRef} style={listStyle} {...props} />
    )
  }
  return (
    <MotionList
      className={classNames}
      data-slot="tabs-list"
      layout
      ref={composedRef}
      style={listStyle}
      transition={TABS_TRANSITION}
      {...props}
    />
  )
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

const tabsTriggerBadgeVariants = cva('font-medium text-muted-foreground text-stroke-0', {
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
})

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
      <TabsPrimitive.Trigger aria-controls={undefined} className={triggerClassName} data-slot="tabs-trigger" {...props}>
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
    <MotionTrigger
      aria-controls={undefined}
      className={triggerClassName}
      data-slot="tabs-trigger"
      layout
      transition={TABS_TRANSITION}
      {...props}
    >
      <m.span className="flex items-center gap-1.5" layout transition={TABS_TRANSITION}>
        {children}
        <AnimatePresence initial={false} mode="popLayout">
          {showCount ? (
            <m.span
              animate={{ opacity: 1, scale: 1 }}
              className={badgeClassName}
              exit={{ opacity: 0, scale: 0.5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              key="count"
              layout
              transition={TABS_TRANSITION}
            >
              {count}
            </m.span>
          ) : null}
        </AnimatePresence>
      </m.span>
    </MotionTrigger>
  )
}
