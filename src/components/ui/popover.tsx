'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'

export const Popover = (props: React.ComponentProps<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
)

export const PopoverTrigger = (props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) => (
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
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  portal?: boolean
  width?: number
}) => {
  const content = (
    <PopoverPrimitive.Content
      align={align}
      className={cn(
        'z-51 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-sm outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        className
      )}
      data-slot="popover-content"
      sideOffset={sideOffset}
      style={{
        ...style,
        width: width ? `${width}px` : style?.width,
      }}
      {...props}
    />
  )

  return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content
}

export const PopoverAnchor = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) => (
  <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
)

export const PopoverPortal = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Portal>) => (
  <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
)
