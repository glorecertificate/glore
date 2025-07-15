'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const TooltipProvider = ({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
)

export const Tooltip = (props: React.ComponentProps<typeof TooltipPrimitive.Root>) => (
  <TooltipProvider>
    <TooltipPrimitive.Root data-slot="tooltip" {...props} />
  </TooltipProvider>
)

export const TooltipTrigger = (props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) => (
  <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
)

export interface TooltipContentProps
  extends Omit<React.ComponentProps<typeof TooltipPrimitive.Content>, 'color'>,
    VariantProps<typeof tooltipContentVariants> {
  arrow?: boolean
}

export const TooltipContent = ({
  arrow = true,
  children,
  className,
  color,
  sideOffset = 4,
  ...props
}: TooltipContentProps) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      className={cn(tooltipContentVariants({ color }), className)}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      {arrow && <TooltipPrimitive.Arrow className={tooltipArrowVariants({ color })} />}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
)

const tooltipContentVariants = cva(
  `
    z-50 max-w-sm rounded-md bg-foreground px-3 py-1.5 text-xs text-background animate-in fade-in-0 zoom-in-95
    data-[side=bottom]:slide-in-from-top-2
    data-[side=left]:slide-in-from-right-2
    data-[side=right]:slide-in-from-left-2
    data-[side=top]:slide-in-from-bottom-2
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
  `,
  {
    variants: {
      color: {
        default: 'bg-foreground/95 text-background',
        success: 'bg-success-accent/95 text-success-foreground',
        warning: 'bg-warning-accent/95 text-warning-foreground',
        destructive: 'bg-destructive/95 text-destructive-foreground',
      },
    },
    defaultVariants: {
      color: 'default',
    },
  },
)

const tooltipArrowVariants = cva('z-50', {
  variants: {
    color: {
      default: 'fill-foreground',
      success: 'fill-success-accent',
      warning: 'fill-warning-accent',
      destructive: 'fill-destructive-accent',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})
