'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { unbanUser } from '@/actions/admin/users'
import { toast } from '@/components/ui/toast'
import { type AdminUserRow } from '@/db/queries/admin-user'

import { ActionDialog } from './action-dialog'
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
    <ActionDialog
      busy={busy}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirmUnban')}
      description={t('unbanDescription', { name: user ? userLabel(user) : '' })}
      loadingLabel={t('unbanning')}
      onConfirm={handleConfirm}
      onOpenChange={onOpenChange}
      open={Boolean(user)}
      title={t('unbanTitle', { name: user ? userLabel(user) : '' })}
    />
  )
}
