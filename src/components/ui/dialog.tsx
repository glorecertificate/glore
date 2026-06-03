'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type VariantProps, cva } from 'class-variance-authority'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export const Dialog = (props: React.ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
)

export const DialogTrigger = (props: React.ComponentProps<typeof DialogPrimitive.Trigger>) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
)

export const DialogPortal = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
)

export const DialogClose = (props: React.ComponentProps<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
)

export const DialogOverlay = ({
  className,
  opacity = 0.5,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & {
  opacity?: number
}) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
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
  portal = true,
  showClose = true,
  size,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    portal?: boolean
    overlay?: number
    showClose?: boolean
  }) => {
  const content = (
    <>
      {overlay && <DialogOverlay opacity={overlay} />}
      <DialogPrimitive.Content
        className={cn(dialogContentVariants({ size }), className)}
        data-slot="dialog-content"
        aria-describedby={undefined}
        {...props}
      >
        {children}
        {showClose && (
          <DialogClose className="absolute top-4 right-4 cursor-pointer rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">{'Close'}</span>
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </>
  )

  if (!portal) {
    return content
  }

  return <DialogPortal data-slot="dialog-portal">{content}</DialogPortal>
}

const dialogContentVariants = cva(
  'fixed top-[50%] left-[50%] z-51 grid w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
      },
    },
  }
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

export const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn('text-lg leading-none font-semibold', className)}
    data-slot="dialog-title"
    {...props}
  />
)

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('text-sm text-muted-foreground', className)}
    data-slot="dialog-description"
    {...props}
  />
)
