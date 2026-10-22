'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { startImpersonation } from '@/actions/admin/impersonation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type AdminUserRow, MIN_ADMIN_REASON_LENGTH } from '@/db/queries/admin-user'
import { APP_ROOT } from '@/lib/constants'
import appConfig from '~/config/app.json'

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
    <Dialog onOpenChange={onOpenChange} open={Boolean(user)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('impersonateTitle', { name: user ? userLabel(user) : '' })}</DialogTitle>
          <DialogDescription>
            {t('impersonateDescription', { minutes: appConfig.impersonationMinutes })}
          </DialogDescription>
        </DialogHeader>
        <ReasonField
          disabled={busy}
          id="impersonate-reason"
          onChange={setReason}
          placeholder={t('impersonateReasonPlaceholder')}
          value={reason}
        />
        <DialogFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={!ready}
            loading={busy}
            loadingText={t('impersonating')}
            onClick={handleConfirm}
            type="button"
          >
            {t('confirmImpersonate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
