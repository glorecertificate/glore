'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const ActionDialog = ({
  busy = false,
  cancelLabel,
  children,
  confirmDisabled = false,
  confirmLabel,
  description,
  loadingLabel,
  onCloseAutoFocus,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = 'default',
}: React.PropsWithChildren<{
  busy?: boolean
  cancelLabel: string
  confirmDisabled?: boolean
  confirmLabel: string
  description: React.ReactNode
  loadingLabel: string
  onCloseAutoFocus?: (event: Event) => void
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: React.ReactNode
  tone?: 'default' | 'destructive'
}>) => {
  const destructive = tone === 'destructive'

  const handleOpenChange = (next: boolean) => {
    if (busy) return
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || confirmDisabled) return
    onConfirm()
  }

  const confirm = (
    <Button
      disabled={confirmDisabled}
      loading={busy}
      loadingText={loadingLabel}
      type="submit"
      variant={destructive ? 'destructive' : 'brand'}
    >
      {confirmLabel}
    </Button>
  )

  if (destructive) {
    return (
      <AlertDialog onOpenChange={handleOpenChange} open={open}>
        <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
          <form className="contents" onSubmit={handleSubmit}>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            {children}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
              {confirm}
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg" onCloseAutoFocus={onCloseAutoFocus}>
        <form className="contents" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button disabled={busy} onClick={() => handleOpenChange(false)} type="button" variant="outline">
              {cancelLabel}
            </Button>
            {confirm}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
