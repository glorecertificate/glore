'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@repo/ui/utils'

export interface TooltipProviderProps extends React.ComponentProps<typeof TooltipPrimitive.Provider> {}

export const TooltipProvider = ({ delayDuration = 0, ...props }: TooltipProviderProps) => (
  <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
)

export interface TooltipProps extends React.ComponentProps<typeof TooltipPrimitive.Root> {}

export const Tooltip = (props: TooltipProps) => (
  <TooltipProvider>
    <TooltipPrimitive.Root data-slot="tooltip" {...props} />
  </TooltipProvider>
)

export interface TooltipTriggerProps extends React.ComponentProps<typeof TooltipPrimitive.Trigger> {
  /**
   * Pointer events applied when `asChild` is used.
   * @default 'none'
   */
  pointerEvents?: 'auto' | 'none'
}

export const TooltipTrigger = ({ className, pointerEvents = 'none', ...props }: TooltipTriggerProps) => (
  <TooltipPrimitive.Trigger
    className={cn(pointerEvents === 'auto' && 'pointer-events-auto!', className)}
    data-slot="tooltip-trigger"
    {...props}
  />
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
  sideOffset = 4,
  size,
  variant,
  ...props
}: TooltipContentProps) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      className={cn(tooltipContentVariants({ size, variant }), className)}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      {arrow && <TooltipPrimitive.Arrow className={tooltipArrowVariants({ variant })} />}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
)

export const tooltipContentVariants = cva(
  `
    z-50 max-w-sm rounded-md animate-in fade-in-0 zoom-in-95
    data-[side=bottom]:slide-in-from-top-2
    data-[side=left]:slide-in-from-right-2
    data-[side=right]:slide-in-from-left-2
    data-[side=top]:slide-in-from-bottom-2
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
  `,
  {
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
    variants: {
      variant: {
        default: 'bg-foreground/95 text-background',
        success: 'bg-success-accent/95 text-success-foreground',
        warning: 'bg-warning-accent/95 text-warning-foreground',
        destructive: 'bg-destructive/95 text-destructive-foreground',
      },
      size: {
        xs: 'px-[7px] py-[3.5px] text-[10.5px]',
        sm: 'px-2 py-1 text-[11px]',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
      },
    },
  },
)

const tooltipArrowVariants = cva('z-50', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'fill-foreground',
      success: 'fill-success-accent',
      warning: 'fill-warning-accent',
      destructive: 'fill-destructive-accent',
    },
  },
})
