'use client'

import { useMemo } from 'react'

import type * as PopoverPrimitive from '@radix-ui/react-popover'
import { Root, Trigger, Content, Portal, Anchor } from '@radix-ui/react-popover'

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
export interface PopoverPortalProps extends PopoverPrimitive.PopoverPortalProps {}

export const Popover = (props: PopoverProps) => <Root data-slot="popover" {...props} />

export const PopoverTrigger = (props: PopoverTriggerProps) => <Trigger data-slot="popover-trigger" {...props} />

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
    [style, width]
  )

  const content = (
    <Content
      align={align}
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in',
        className
      )}
      data-slot="popover-content"
      sideOffset={sideOffset}
      style={contentStyle}
      {...props}
    />
  )

  if (!portal) return content
  return <Portal>{content}</Portal>
}

export const PopoverAnchor = ({ ...props }: React.ComponentProps<typeof Anchor>) => (
  <Anchor data-slot="popover-anchor" {...props} />
)

export const PopoverPortal = ({ ...props }: PopoverPortalProps) => <Portal data-slot="popover-portal" {...props} />
