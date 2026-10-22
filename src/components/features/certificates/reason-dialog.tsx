'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export const MIN_REASON_LENGTH = 10
const MAX_REASON_LENGTH = 2000

export const ReasonDialog = ({
  busy,
  cancelLabel,
  confirmLabel,
  description,
  hint,
  id,
  label,
  loadingLabel,
  onConfirm,
  onOpenChange,
  open,
  placeholder,
  title,
}: {
  busy: boolean
  cancelLabel: string
  confirmLabel: string
  description: string
  hint: string
  id: string
  label: string
  loadingLabel: string
  onConfirm: (reason: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  placeholder: string
  title: string
}) => {
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor={id}>
            {label}
          </label>
          <Textarea
            id={id}
            maxLength={MAX_REASON_LENGTH}
            onChange={event => setReason(event.target.value)}
            placeholder={placeholder}
            value={reason}
          />
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {cancelLabel}
          </Button>
          <Button
            disabled={trimmed.length < MIN_REASON_LENGTH}
            loading={busy}
            loadingText={loadingLabel}
            onClick={() => onConfirm(trimmed)}
            type="button"
            variant="destructive"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
