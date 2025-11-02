'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { type VariantProps } from 'class-variance-authority'

import { Spinner } from '@/components/icons/spinner'
import { type Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const AlertDialog = (props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
)

export const AlertDialogTrigger = (props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) => (
  <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
)

export const AlertDialogPortal = (props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) => (
  <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
)

export const AlertDialogOverlay = ({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-51 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    data-slot="alert-dialog-overlay"
    {...props}
  />
)

export const AlertDialogContent = ({
  className,
  portal = true,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  portal?: boolean
}) => {
  const content = (
    <>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'translate-[-50%] data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-51 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg',
          className
        )}
        data-slot="alert-dialog-content"
        {...props}
      />
    </>
  )
  if (!portal) return content
  return <AlertDialogPortal>{content}</AlertDialogPortal>
}

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

export const AlertDialogTitle = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title
    className={cn('font-semibold text-lg', className)}
    data-slot="alert-dialog-title"
    {...props}
  />
)

export const AlertDialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description
    className={cn('text-muted-foreground text-sm', className)}
    data-slot="alert-dialog-description"
    {...props}
  />
)

export const AlertDialogAction = ({
  children,
  className,
  disabled,
  effect,
  loading,
  loadingText,
  size,
  variant,
  ...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Action>, 'disabled'> &
  VariantProps<typeof Button> & {
    loading?: boolean
    loadingText?: string
  }) => {
  const isDisabled = disabled || loading

  return (
    <AlertDialogPrimitive.Action
      className={cn(
        'cursor-pointer',
        buttonVariants({ variant, disabled: isDisabled, size, effect }),
        isDisabled && 'cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </AlertDialogPrimitive.Action>
  )
}

export const AlertDialogCancel = ({
  className,
  disabled,
  effect,
  size,
  variant,
  ...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Cancel>, 'disabled'> & VariantProps<typeof Button>) => (
  <AlertDialogPrimitive.Cancel
    className={cn(
      'cursor-pointer',
      buttonVariants({ variant, disabled, size, effect }),
      disabled && 'cursor-not-allowed',
      className
    )}
    {...props}
  />
)
