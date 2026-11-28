'use client'

import { useState } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { useDragDismiss } from '@/hooks/use-drag-dismiss'
import { focusRootOnTouch } from '@/lib/pointer'
import { cn } from '@/lib/utils'

export const Sheet = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root data-slot="sheet" {...props} />
)

export const SheetTrigger = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) => (
  <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
)

export const SheetClose = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close data-slot="sheet-close" {...props} />
)

export const SheetPortal = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) => (
  <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
)

export const SheetOverlay = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none',
      className
    )}
    data-slot="sheet-overlay"
    {...props}
  />
)

export const SheetContent = ({
  children,
  className,
  closeSrText,
  onOpenAutoFocus,
  ref,
  side = 'right',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  closeSrText?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}) => {
  const t = useTranslations('Components.Dialog')
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const composedRef = useComposedRefs(setNode, ref)

  useDragDismiss(node, { enabled: side === 'bottom' })

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-background shadow-lg ease-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-300 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none',
          side === 'right' &&
            'inset-y-0 right-0 h-dvh w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
          side === 'left' &&
            'inset-y-0 left-0 h-dvh w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
          side === 'top' &&
            'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
          side === 'bottom' &&
            'inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          className
        )}
        data-slot="sheet-content"
        onOpenAutoFocus={event => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          focusRootOnTouch(event)
        }}
        ref={composedRef}
        {...props}
      >
        {side === 'bottom' && (
          <span
            aria-hidden
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border-strong"
            data-slot="sheet-handle"
          />
        )}
        {children}
        <DialogPrimitive.Close className="touch-hit absolute top-3 right-3 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color] duration-150 hover:bg-accent hover:text-foreground focus-visible:focus-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <LucideIcon name="x" />
          <span className="sr-only">{closeSrText ?? t('close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

export const SheetHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex flex-col gap-1.5 p-4', className)} data-slot="sheet-header" {...props} />
)

export const SheetFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} data-slot="sheet-footer" {...props} />
)

export const SheetTitle = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn('type-heading text-foreground', className)}
    data-slot="sheet-title"
    suppressHydrationWarning
    {...props}
  />
)

export const SheetDescription = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('text-sm text-muted-foreground', className)}
    data-slot="sheet-description"
    {...props}
  />
)
