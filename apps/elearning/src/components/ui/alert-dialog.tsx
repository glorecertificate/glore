'use client'

import {
  Action,
  Cancel,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from '@radix-ui/react-alert-dialog'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const AlertDialog = ({ ...props }: React.ComponentProps<typeof Root>) => (
  <Root data-slot="alert-dialog" {...props} />
)

export const AlertDialogTrigger = ({ ...props }: React.ComponentProps<typeof Trigger>) => (
  <Trigger data-slot="alert-dialog-trigger" {...props} />
)

export const AlertDialogPortal = ({ ...props }: React.ComponentProps<typeof Portal>) => (
  <Portal data-slot="alert-dialog-portal" {...props} />
)

export const AlertDialogOverlay = ({ className, ...props }: React.ComponentProps<typeof Overlay>) => (
  <Overlay
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    data-slot="alert-dialog-overlay"
    {...props}
  />
)

export const AlertDialogContent = ({ className, ...props }: React.ComponentProps<typeof Content>) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <Content
      className={cn(
        'translate-[-50%] data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg',
        className
      )}
      data-slot="alert-dialog-content"
      {...props}
    />
  </AlertDialogPortal>
)

export const AlertDialogHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
    data-slot="alert-dialog-header"
    {...props}
  />
)

export const AlertDialogFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    data-slot="alert-dialog-footer"
    {...props}
  />
)

export const AlertDialogTitle = ({ className, ...props }: React.ComponentProps<typeof Title>) => (
  <Title className={cn('font-semibold text-lg', className)} data-slot="alert-dialog-title" {...props} />
)

export const AlertDialogDescription = ({ className, ...props }: React.ComponentProps<typeof Description>) => (
  <Description
    className={cn('text-muted-foreground text-sm', className)}
    data-slot="alert-dialog-description"
    {...props}
  />
)

export const AlertDialogAction = ({ className, ...props }: React.ComponentProps<typeof Action>) => (
  <Action className={cn(buttonVariants(), className)} {...props} />
)

export const AlertDialogCancel = ({ className, ...props }: React.ComponentProps<typeof Cancel>) => (
  <Cancel className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />
)
