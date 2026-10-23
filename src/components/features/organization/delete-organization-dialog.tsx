'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const DeleteOrganizationDialog = ({
  onConfirm,
  onOpenChange,
  open,
  organizationName,
}: {
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationName: string
}) => {
  const t = useTranslations('Organization')
  const [deleting, setDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const confirmed = confirmation.trim().toLowerCase() === organizationName.trim().toLowerCase()

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmation('')
    onOpenChange(next)
  }

  const handleConfirm = async () => {
    if (!confirmed) return
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteOrganizationTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteOrganizationDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-organization-confirmation">{t('confirmNameLabel', { name: organizationName })}</Label>
          <Input
            autoComplete="off"
            disabled={deleting}
            id="delete-organization-confirmation"
            onChange={event => setConfirmation(event.target.value)}
            value={confirmation}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!confirmed}
            loading={deleting}
            loadingText={t('deleting')}
            onClick={event => {
              event.preventDefault()
              void handleConfirm()
            }}
            variant="destructive"
          >
            {t('deleteOrganization')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
