'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { restoreMenuTrigger } from './menu-focus'

export const ActionDialog = ({
  busy = false,
  cancelLabel,
  children,
  confirmDisabled = false,
  confirmLabel,
  description,
  loadingLabel,
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
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: React.ReactNode
  tone?: 'default' | 'destructive'
}>) => {
  const handleOpenChange = (next: boolean) => {
    if (busy) return
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || confirmDisabled) return
    onConfirm()
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg" onCloseAutoFocus={event => restoreMenuTrigger() && event.preventDefault()}>
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
            <Button
              disabled={confirmDisabled}
              loading={busy}
              loadingText={loadingLabel}
              type="submit"
              variant={tone === 'destructive' ? 'destructive' : 'brand'}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
