'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { banUser } from '@/actions/admin/users'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/components/ui/toast'
import { type AdminUserRow, MIN_ADMIN_REASON_LENGTH } from '@/db/queries/admin-user'

import { ActionDialog } from './action-dialog'
import { ReasonField } from './reason-field'
import { useAdminError } from './use-admin-error'
import { userLabel } from './utils'

const DAY = 24 * 60 * 60 * 1000

const DURATIONS = ['forever', 'day', 'week', 'month', 'custom'] as const

type Duration = (typeof DURATIONS)[number]

const DURATION_MS = {
  custom: null,
  day: DAY,
  forever: null,
  month: 30 * DAY,
  week: 7 * DAY,
} as const satisfies Record<Duration, number | null>

const endOfDay = (date: string) => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59)
}

const tomorrow = () => {
  const next = new Date(Date.now() + DAY)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

export const BanDialog = ({
  onCloseAutoFocus,
  onDone,
  onOpenChange,
  user,
}: {
  onCloseAutoFocus?: (event: Event) => void
  onDone: () => void
  onOpenChange: (open: boolean) => void
  user: AdminUserRow | null
}) => {
  const t = useTranslations('Admin.users')
  const adminError = useAdminError()
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState<Duration>('forever')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  const ready = reason.trim().length >= MIN_ADMIN_REASON_LENGTH && (duration !== 'custom' || Boolean(date)) && !busy

  const resolveExpiry = () => {
    if (duration === 'custom') return endOfDay(date).toISOString()
    const durationMs = DURATION_MS[duration]
    return durationMs === null ? null : new Date(Date.now() + durationMs).toISOString()
  }

  const handleConfirm = async () => {
    if (!(user && ready)) return
    setBusy(true)
    try {
      const { error } = await banUser({ expiresAt: resolveExpiry(), reason: reason.trim(), userId: user.id })
      if (error) {
        toast.error(adminError(error.code))
        return
      }

      toast.success(t('banSuccess', { name: userLabel(user) }))
      onOpenChange(false)
      onDone()
    } catch {
      toast.error(t('banError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ActionDialog
      onCloseAutoFocus={onCloseAutoFocus}
      busy={busy}
      cancelLabel={t('cancel')}
      confirmDisabled={!ready}
      confirmLabel={t('confirmBan')}
      description={t('banDescription', { name: user ? userLabel(user) : '' })}
      loadingLabel={t('banning')}
      onConfirm={handleConfirm}
      onOpenChange={onOpenChange}
      open={Boolean(user)}
      title={t('banTitle', { name: user ? userLabel(user) : '' })}
      tone="destructive"
    >
      <ReasonField
        disabled={busy}
        id="ban-reason"
        onChange={setReason}
        placeholder={t('banReasonPlaceholder')}
        value={reason}
      />
      <div className="grid gap-2">
        <Label>{t('banDuration')}</Label>
        <RadioGroup
          aria-label={t('banDuration')}
          className="grid grid-cols-2 gap-2"
          disabled={busy}
          onValueChange={value => setDuration(value as Duration)}
          value={duration}
        >
          {DURATIONS.map(option => (
            <Label className="flex items-center gap-2 font-normal" key={option}>
              <RadioGroupItem value={option} />
              {t(`duration_${option}`)}
            </Label>
          ))}
        </RadioGroup>
        {duration === 'custom' && (
          <div className="grid gap-2">
            <Label htmlFor="ban-date">{t('banEndsOn')}</Label>
            <Input
              disabled={busy}
              id="ban-date"
              min={tomorrow()}
              onChange={event => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </div>
        )}
      </div>
    </ActionDialog>
  )
}
