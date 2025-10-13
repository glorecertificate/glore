'use client'

import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export const Dialog = (props: React.ComponentProps<typeof Root>) => <Root data-slot="dialog" {...props} />

export const DialogTrigger = (props: React.ComponentProps<typeof Trigger>) => (
  <Trigger data-slot="dialog-trigger" {...props} />
)

export const DialogPortal = (props: React.ComponentProps<typeof Portal>) => (
  <Portal data-slot="dialog-portal" {...props} />
)

export const DialogClose = (props: React.ComponentProps<typeof Close>) => <Close data-slot="dialog-close" {...props} />

export const DialogOverlay = ({
  className,
  opacity = 0.5,
  style,
  ...props
}: React.ComponentProps<typeof Overlay> & {
  opacity?: number
}) => (
  <Overlay
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    data-slot="dialog-overlay"
    style={{ opacity, ...style }}
    {...props}
  />
)

export const DialogContent = ({
  children,
  className,
  overlay = 0.5,
  showClose = true,
  ...props
}: React.ComponentProps<typeof Content> & {
  overlay?: number
  showClose?: boolean
}) => (
  <DialogPortal data-slot="dialog-portal">
    {overlay && <DialogOverlay opacity={overlay} />}
    <Content
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 translate-[-50%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg',
        className
      )}
      data-slot="dialog-content"
      {...props}
    >
      {children}
      {showClose && (
        <Close
          className={`absolute top-4 right-4 cursor-pointer rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`}
        >
          <XIcon />
          <span className="sr-only">{'Close'}</span>
        </Close>
      )}
    </Content>
  </DialogPortal>
)

export const DialogHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} data-slot="dialog-header" {...props} />
)

export const DialogFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    data-slot="dialog-footer"
    {...props}
  />
)

export const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof Title>) => (
  <Title className={cn('font-semibold text-lg leading-none', className)} data-slot="dialog-title" {...props} />
)

export const DialogDescription = ({ className, ...props }: React.ComponentProps<typeof Description>) => (
  <Description className={cn('text-muted-foreground text-sm', className)} data-slot="dialog-description" {...props} />
)
