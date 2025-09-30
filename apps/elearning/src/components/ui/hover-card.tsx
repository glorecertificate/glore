'use client'

import { Arrow, Root, Trigger, Portal, Content } from '@radix-ui/react-hover-card'

import { cn } from '@/lib/utils'

export const HoverCard = (props: React.ComponentProps<typeof Root>) => <Root data-slot="hover-card" {...props} />

export const HoverCardTrigger = (props: React.ComponentProps<typeof Trigger>) => (
  <Trigger data-slot="hover-card-trigger" {...props} />
)

export const HoverCardContent = ({
  align = 'center',
  arrow = true,
  children,
  className,
  side,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Content> & {
  arrow?: boolean
}) => (
  <Portal data-slot="hover-card-portal">
    <Content
      align={align}
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 relative z-50 origin-(--radix-hover-card-content-transform-origin) rounded-lg border bg-popover p-3.5 text-popover-foreground shadow-xs outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in',
        className
      )}
      data-slot="hover-card-content"
      side={side}
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      {arrow && (
        <>
          <Arrow className={cn('h-2 fill-popover stroke-2 stroke-border', side === 'top' && '-m-0.5 z-0')} />
          <div className="absolute bottom-0 left-2 h-1 w-[calc(100%-16px)] rounded-[inherit] bg-popover" />
        </>
      )}
    </Content>
  </Portal>
)
