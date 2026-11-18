'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { startImpersonation } from '@/actions/admin/impersonation'
import { toast } from '@/components/ui/toast'
import { type AdminUserRow, MIN_ADMIN_REASON_LENGTH } from '@/db/queries/admin-user'
import { APP_ROOT } from '@/lib/constants'
import appConfig from '~/config/app.json'

import { ActionDialog } from './action-dialog'
import { ReasonField } from './reason-field'
import { useAdminError } from './use-admin-error'
import { userLabel } from './utils'

export const ImpersonateDialog = ({
  onOpenChange,
  user,
}: {
  onOpenChange: (open: boolean) => void
  user: AdminUserRow | null
}) => {
  const t = useTranslations('Admin.users')
  const adminError = useAdminError()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = reason.trim().length >= MIN_ADMIN_REASON_LENGTH && !busy

  const handleConfirm = async () => {
    if (!(user && ready)) return
    setBusy(true)
    const { error } = await startImpersonation({ reason: reason.trim(), userId: user.id })

    if (error) {
      setBusy(false)
      toast.error(adminError(error.code))
      return
    }

    window.location.assign(APP_ROOT)
  }

  return (
    <ActionDialog
      busy={busy}
      cancelLabel={t('cancel')}
      confirmDisabled={!ready}
      confirmLabel={t('confirmImpersonate')}
      description={t('impersonateDescription', { minutes: appConfig.impersonationMinutes })}
      loadingLabel={t('impersonating')}
      onConfirm={handleConfirm}
      onOpenChange={onOpenChange}
      open={Boolean(user)}
      title={t('impersonateTitle', { name: user ? userLabel(user) : '' })}
    >
      <ReasonField
        disabled={busy}
        id="impersonate-reason"
        onChange={setReason}
        placeholder={t('impersonateReasonPlaceholder')}
        value={reason}
      />
    </ActionDialog>
  )
}
