'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { featureCertificate, withdrawCertificate } from '@/actions/certificates/requests'
import { revokeCertificate } from '@/actions/certificates/review'
import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { MIN_REASON_LENGTH, ReasonDialog } from '@/components/features/certificates/reason-dialog'
import { useSession } from '@/components/providers/session'
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
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { useActionError } from '@/hooks/use-action-error'

export const CertificateActions = ({ canManage, certificate }: { canManage: boolean; certificate: Certificate }) => {
  const t = useTranslations('CertificateDetail')
  const tWizard = useTranslations('CertificateWizard')

  const actionError = useActionError()
  const { refresh, push } = useRouter()
  const { impersonating, user } = useSession()
  const [pending, startTransition] = useTransition()
  const [withdrawing, setWithdrawing] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const isOwner = certificate.userId === user.id
  const canReview =
    user.isTutor && certificate.reviewerId === user.id && (certificate.isSubmitted || certificate.isInReview)
  const canEdit = isOwner && (certificate.isDraft || certificate.isChangesRequested)
  const canWithdraw = isOwner && certificate.isOpen
  const canFeature = isOwner && certificate.isApproved && !certificate.isDefault
  const canRevoke = canManage && certificate.isApproved
  const pdfHref = certificate.documentUrl ?? `/api/v1/certificates/${certificate.id}/pdf`

  const withdraw = () =>
    startTransition(async () => {
      const { error } = await withdrawCertificate(certificate.id)
      setWithdrawing(false)
      if (error) return void toast.error(t('withdrawError'))
      toast.success(t('withdrawn'))
      return push('/certificates')
    })

  const feature = () =>
    startTransition(async () => {
      const { error } = await featureCertificate(certificate.id)
      if (error) return void toast.error(actionError(error, t('featureError')))
      toast.success(t('featured'))
      return refresh()
    })

  const revoke = (reason: string) =>
    startTransition(async () => {
      const { error } = await revokeCertificate(certificate.id, { reason })
      setRevoking(false)
      if (error) return void toast.error(actionError(error, t('revokeError')))
      toast.success(t('revoked'))
      return refresh()
    })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <Button asChild icon="pencil" size="sm" variant="brand">
          <Link href={`/certificates/new?draft=${certificate.id}`}>
            {certificate.isDraft ? tWizard('continueDraft') : t('resubmitButton')}
          </Link>
        </Button>
      )}
      {canReview && (
        <Button asChild icon="clipboard-check" size="sm" variant="brand">
          <Link href={`/certificates/${certificate.id}/review`}>{t('openReview')}</Link>
        </Button>
      )}
      {certificate.isApproved && (
        <Button asChild icon="download" size="sm" variant="outline">
          <a href={pdfHref} rel="noopener noreferrer" target="_blank">
            {t('download')}
          </a>
        </Button>
      )}
      {canFeature && (
        <Button disabled={pending || impersonating} icon="star" onClick={feature} size="sm" variant="outline">
          {t('makeFeatured')}
        </Button>
      )}
      {canWithdraw && (
        <Button disabled={pending} icon="undo-2" onClick={() => setWithdrawing(true)} size="sm" variant="ghost">
          {t('withdraw')}
        </Button>
      )}
      {canRevoke && (
        <Button
          disabled={pending || impersonating}
          icon="shield-off"
          onClick={() => setRevoking(true)}
          size="sm"
          variant="ghost"
        >
          {t('revoke')}
        </Button>
      )}
      {(canFeature || canRevoke) && <ImpersonationLockNote className="basis-full" />}

      <AlertDialog onOpenChange={setWithdrawing} open={withdrawing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('withdrawTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('withdrawDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={withdraw}>
              {t('withdrawConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReasonDialog
        busy={pending}
        cancelLabel={t('cancel')}
        confirmLabel={t('revokeConfirm')}
        description={t('revokeDescription')}
        hint={t('revokeHint', { min: MIN_REASON_LENGTH })}
        id="revoke-reason"
        label={t('revokeReason')}
        loadingLabel={t('revoking')}
        onConfirm={revoke}
        onOpenChange={setRevoking}
        open={revoking}
        placeholder={t('revokePlaceholder')}
        title={t('revokeTitle')}
      />
    </div>
  )
}
