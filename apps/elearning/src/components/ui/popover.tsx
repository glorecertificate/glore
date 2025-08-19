'use client'

import { useMemo } from 'react'

import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'

export interface PopoverProps extends PopoverPrimitive.PopoverProps {
  className?: string
}
export interface PopoverTriggerProps extends PopoverPrimitive.PopoverTriggerProps {
  className?: string
}
export interface PopoverContentProps extends PopoverPrimitive.PopoverContentProps {
  className?: string
  portal?: boolean
  width?: number
}

export const Popover = (props: PopoverProps) => <PopoverPrimitive.Root data-slot="popover" {...props} />

export const PopoverTrigger = (props: PopoverTriggerProps) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
)

export const PopoverContent = ({
  align = 'center',
  className,
  portal = true,
  sideOffset = 4,
  style,
  width,
  ...props
}: PopoverContentProps) => {
  const contentStyle = useMemo(
    () => ({
      ...style,
      width: width ? `${width}px` : style?.width,
    }),
    [style, width],
  )

  const content = useMemo(
    () => (
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          `
            z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md
            outline-hidden
            data-[side=bottom]:slide-in-from-top-2
            data-[side=left]:slide-in-from-right-2
            data-[side=right]:slide-in-from-left-2
            data-[side=top]:slide-in-from-bottom-2
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          `,
          className,
        )}
        data-slot="popover-content"
        sideOffset={sideOffset}
        style={contentStyle}
        {...props}
      />
    ),
    [align, className, contentStyle, props, sideOffset],
  )

  if (!portal) return content
  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
}

export const PopoverAnchor = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) => (
  <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
)
