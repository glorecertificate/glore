'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { type VariantProps } from 'class-variance-authority'

import { type Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
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
      'fixed inset-0 z-51 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
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
          'fixed top-[50%] left-[50%] z-51 grid w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
          className
        )}
        data-slot="alert-dialog-content"
        {...props}
      />
    </>
  )
  if (!portal) {
    return content
  }
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
    className={cn('text-lg font-semibold', className)}
    data-slot="alert-dialog-title"
    {...props}
  />
)

export const AlertDialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description
    className={cn('text-sm text-muted-foreground', className)}
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
  spinner,
  variant,
  ...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Action>, 'disabled'> &
  VariantProps<typeof Button> & {
    loading?: boolean
    loadingText?: string
    spinner?: string
  }) => {
  const isDisabled = disabled || loading

  return (
    <AlertDialogPrimitive.Action
      className={cn(
        'cursor-pointer',
        buttonVariants({ effect, size, variant }),
        isDisabled && 'cursor-not-allowed',
        loading && 'cursor-wait',
        'transition-colors',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          {loadingText ?? children}
          <Spinner className={spinner} />
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
      buttonVariants({ effect, size, variant }),
      disabled && 'cursor-not-allowed',
      className
    )}
    {...props}
  />
)
