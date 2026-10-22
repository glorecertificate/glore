'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { unbanUser } from '@/actions/admin/users'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type AdminUserRow } from '@/db/queries/admin-user'

import { useAdminError } from './use-admin-error'
import { userLabel } from './utils'

export const UnbanDialog = ({
  onDone,
  onOpenChange,
  user,
}: {
  onDone: () => void
  onOpenChange: (open: boolean) => void
  user: AdminUserRow | null
}) => {
  const t = useTranslations('Admin.users')
  const adminError = useAdminError()
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    if (!user) return
    setBusy(true)
    const { error } = await unbanUser(user.id)
    setBusy(false)

    if (error) {
      toast.error(adminError(error.code))
      return
    }

    toast.success(t('unbanSuccess', { name: userLabel(user) }))
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(user)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('unbanTitle', { name: user ? userLabel(user) : '' })}</DialogTitle>
          <DialogDescription>{t('unbanDescription', { name: user ? userLabel(user) : '' })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button loading={busy} loadingText={t('unbanning')} onClick={handleConfirm} type="button">
            {t('confirmUnban')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
