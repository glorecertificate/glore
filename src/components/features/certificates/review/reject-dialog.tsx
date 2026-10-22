'use client'

import { useTranslations } from 'next-intl'

import { MIN_REASON_LENGTH, ReasonDialog } from '@/components/features/certificates/reason-dialog'

export const RejectDialog = ({
  busy,
  onConfirm,
  onOpenChange,
  open,
}: {
  busy: boolean
  onConfirm: (reason: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Certificates.review')

  return (
    <ReasonDialog
      busy={busy}
      cancelLabel={t('cancel')}
      confirmLabel={t('reject')}
      description={t('rejectDescription')}
      hint={t('rejectHint', { min: MIN_REASON_LENGTH })}
      id="reject-reason"
      label={t('rejectReason')}
      loadingLabel={t('rejecting')}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      placeholder={t('rejectPlaceholder')}
      title={t('rejectTitle')}
    />
  )
}
