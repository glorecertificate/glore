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

export const DeleteOrganizationDialog = ({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Organization')
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteOrganizationTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteOrganizationDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={deleting}
            loadingText={t('deleting')}
            onClick={handleConfirm}
            variant="destructive"
          >
            {t('deleteOrganization')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
