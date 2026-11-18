'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type VariantProps, cva } from 'class-variance-authority'
import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { cn } from '@/lib/utils'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const findFirstFocusable = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
    element => !element.closest('[data-slot=dialog-close-anchor]')
  )

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
  onOpenAutoFocus,
  size,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    portal?: boolean
    overlay?: number
    showClose?: boolean
  }) => {
  const t = useTranslations('Components.Dialog')
  const content = (
    <>
      {overlay && <DialogOverlay opacity={overlay} />}
      <DialogPrimitive.Content
        className={cn(dialogContentVariants({ size }), showClose && 'pt-2', className)}
        data-slot="dialog-content"
        aria-describedby={undefined}
        onOpenAutoFocus={event => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          const first = findFirstFocusable(event.currentTarget as HTMLElement)
          if (!first) return
          event.preventDefault()
          first.focus()
        }}
        {...props}
      >
        {showClose && (
          <div className="pointer-events-none sticky top-2 z-10 h-0" data-slot="dialog-close-anchor">
            <DialogClose className="pointer-events-auto absolute top-1 -right-3 flex size-8 cursor-pointer items-center justify-center rounded-md bg-background text-muted-foreground transition-[color,background-color] duration-150 hover:bg-accent hover:text-foreground focus-visible:focus-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <LucideIcon name="x" />
              <span className="sr-only">{t('close')}</span>
            </DialogClose>
          </div>
        )}
        {children}
      </DialogPrimitive.Content>
    </>
  )

  if (!portal) {
    return content
  }

  return <DialogPortal data-slot="dialog-portal">{content}</DialogPortal>
}

const dialogContentVariants = cva(
  'fixed top-[50%] left-[50%] z-51 grid max-h-dialog w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-lg duration-200 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
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
    className={cn('pr-6 text-lg leading-snug font-semibold', className)}
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
