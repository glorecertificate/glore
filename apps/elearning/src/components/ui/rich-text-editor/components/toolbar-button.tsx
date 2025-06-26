import { useMemo } from 'react'

import type { TooltipContentProps } from '@radix-ui/react-tooltip'

import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ToolbarButtonProps extends React.ComponentPropsWithoutRef<typeof Toggle> {
  isActive?: boolean
  tooltip?: string
  tooltipOptions?: TooltipContentProps
}

export const ToolbarButton = ({
  children,
  className,
  isActive,
  tooltip,
  tooltipOptions,
  ...props
}: ToolbarButtonProps) => {
  const toggleButton = useMemo(
    () => (
      <Toggle className={cn('size-8 p-0', { 'bg-accent': isActive }, className)} size="sm" {...props}>
        {children}
      </Toggle>
    ),
    [children, className, isActive, props],
  )

  if (!tooltip) {
    return toggleButton
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
      <TooltipContent {...tooltipOptions}>
        <div className="flex flex-col items-center text-center">{tooltip}</div>
      </TooltipContent>
    </Tooltip>
  )
}
