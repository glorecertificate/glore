'use client'

import { useState } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type VariantProps, cva } from 'class-variance-authority'
import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { useDragDismiss } from '@/hooks/use-drag-dismiss'
import { finePointer } from '@/lib/pointer'
import { cn } from '@/lib/utils'

export const dialogSheetClassName =
  "max-sm:before:absolute max-sm:before:top-2 max-sm:before:left-1/2 max-sm:before:h-1 max-sm:before:w-10 max-sm:before:-translate-x-1/2 max-sm:before:rounded-full max-sm:before:bg-border-strong max-sm:before:content-[''] max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-0 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"

export const dialogFooterClassName =
  'flex flex-col gap-2 max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:-mx-6 max-sm:border-t max-sm:bg-background max-sm:px-6 max-sm:pt-3 max-sm:pb-sheet-footer sm:flex-row sm:justify-end'

const VISIBLE = ':not([aria-hidden=true]):not([tabindex="-1"])'

const FIELDS = [
  `input:not([type=hidden]):not([disabled])${VISIBLE}`,
  `textarea:not([disabled])${VISIBLE}`,
  `select:not([disabled])${VISIBLE}`,
  `[contenteditable]:not([contenteditable=false])${VISIBLE}`,
].join(', ')

const focusInitial = (root: HTMLElement) => {
  const active = document.activeElement
  if (active && active !== root && root.contains(active)) return
  if (!finePointer()) return root.focus({ preventScroll: true })
  const field = [...root.querySelectorAll<HTMLElement>(FIELDS)].find(
    element => (element.checkVisibility?.() ?? true) && !element.closest('[data-slot=dialog-footer]')
  )
  ;(field ?? root).focus({ preventScroll: true })
}

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
      'fixed inset-0 z-50 bg-black data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none',
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
  ref,
  size,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    portal?: boolean
    overlay?: number
    showClose?: boolean
  }) => {
  const t = useTranslations('Components.Dialog')
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const composedRef = useComposedRefs(setNode, ref)

  useDragDismiss(node)

  const content = (
    <>
      {overlay && <DialogOverlay opacity={overlay} />}
      <DialogPrimitive.Content
        className={cn(dialogContentVariants({ size }), dialogSheetClassName, showClose && 'pt-2', className)}
        data-close={showClose}
        data-slot="dialog-content"
        aria-describedby={undefined}
        onOpenAutoFocus={event => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
          focusInitial(event.currentTarget as HTMLElement)
        }}
        ref={composedRef}
        {...props}
      >
        {showClose && (
          <div className="pointer-events-none sticky top-0 z-10 h-0" data-slot="dialog-close-anchor">
            <DialogClose className="pointer-events-auto touch-hit absolute top-1 -right-3 flex size-8 cursor-pointer items-center justify-center rounded-md bg-background text-muted-foreground transition-[color,background-color] duration-150 hover:bg-accent hover:text-foreground focus-visible:focus-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
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
  'group/dialog fixed top-[50%] left-[50%] z-51 grid max-h-dialog w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-lg duration-200 ease-out focus-visible:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
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
  <div className={cn('flex flex-col gap-2 text-left', className)} data-slot="dialog-header" {...props} />
)

export const DialogFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn(dialogFooterClassName, className)} data-slot="dialog-footer" {...props} />
)

export const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn('type-heading text-foreground group-data-[close=true]/dialog:pr-6', className)}
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
