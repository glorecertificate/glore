'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'

import { cn } from '@repo/ui/utils'

export const HoverCard = (props: React.ComponentProps<typeof HoverCardPrimitive.Root>) => (
  <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
)

export const HoverCardTrigger = (props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) => (
  <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
)

export const HoverCardContent = ({
  align = 'center',
  arrow = true,
  children,
  className,
  side,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content> & {
  arrow?: boolean
}) => (
  <HoverCardPrimitive.Portal data-slot="hover-card-portal">
    <HoverCardPrimitive.Content
      align={align}
      className={cn(
        `
          relative z-50 origin-(--radix-hover-card-content-transform-origin) rounded-lg border bg-popover p-3.5 text-popover-foreground
          shadow-xs outline-hidden
          data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
          data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
        `,
        className,
      )}
      data-slot="hover-card-content"
      side={side}
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      {arrow && (
        <>
          <HoverCardPrimitive.Arrow
            className={cn('h-2 fill-popover stroke-border stroke-2', side === 'top' && 'z-0 -m-0.5')}
          />
          <div className="absolute bottom-0 left-2 h-1 w-[calc(100%-16px)] rounded-[inherit] bg-popover" />
        </>
      )}
    </HoverCardPrimitive.Content>
  </HoverCardPrimitive.Portal>
)
