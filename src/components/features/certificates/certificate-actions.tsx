'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { ClipboardCheckIcon, DownloadIcon, PencilIcon, ShieldOffIcon, StarIcon, Undo2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { featureCertificate, withdrawCertificate } from '@/actions/certificates/requests'
import { revokeCertificate } from '@/actions/certificates/review'
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

export const CertificateActions = ({ canManage, certificate }: { canManage: boolean; certificate: Certificate }) => {
  const t = useTranslations('Certificates')
  const tDetail = useTranslations('Certificates.detail')
  const { refresh, push } = useRouter()
  const { user } = useSession()
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
      if (error) return void toast.error(tDetail('withdrawError'))
      toast.success(tDetail('withdrawn'))
      return push('/certificates')
    })

  const feature = () =>
    startTransition(async () => {
      const { error } = await featureCertificate(certificate.id)
      if (error) return void toast.error(tDetail('featureError'))
      toast.success(tDetail('featured'))
      return refresh()
    })

  const revoke = (reason: string) =>
    startTransition(async () => {
      const { error } = await revokeCertificate(certificate.id, { reason })
      setRevoking(false)
      if (error) return void toast.error(tDetail('revokeError'))
      toast.success(tDetail('revoked'))
      return refresh()
    })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <Button asChild icon={PencilIcon} size="sm" variant="brand">
          <Link href={`/certificates/new?draft=${certificate.id}`}>
            {certificate.isDraft ? t('wizard.continueDraft') : t('resubmitButton')}
          </Link>
        </Button>
      )}
      {canReview && (
        <Button asChild icon={ClipboardCheckIcon} size="sm" variant="brand">
          <Link href={`/certificates/${certificate.id}/review`}>{t('openReview')}</Link>
        </Button>
      )}
      {certificate.isApproved && (
        <Button asChild icon={DownloadIcon} size="sm" variant="outline">
          <a href={pdfHref} rel="noopener noreferrer" target="_blank">
            {t('download')}
          </a>
        </Button>
      )}
      {canFeature && (
        <Button disabled={pending} icon={StarIcon} onClick={feature} size="sm" variant="outline">
          {tDetail('makeFeatured')}
        </Button>
      )}
      {canWithdraw && (
        <Button disabled={pending} icon={Undo2Icon} onClick={() => setWithdrawing(true)} size="sm" variant="ghost">
          {tDetail('withdraw')}
        </Button>
      )}
      {canRevoke && (
        <Button disabled={pending} icon={ShieldOffIcon} onClick={() => setRevoking(true)} size="sm" variant="ghost">
          {tDetail('revoke')}
        </Button>
      )}

      <AlertDialog onOpenChange={setWithdrawing} open={withdrawing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDetail('withdrawTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{tDetail('withdrawDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tDetail('cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={withdraw}>
              {tDetail('withdrawConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReasonDialog
        busy={pending}
        cancelLabel={tDetail('cancel')}
        confirmLabel={tDetail('revokeConfirm')}
        description={tDetail('revokeDescription')}
        hint={tDetail('revokeHint', { min: MIN_REASON_LENGTH })}
        id="revoke-reason"
        label={tDetail('revokeReason')}
        loadingLabel={tDetail('revoking')}
        onConfirm={revoke}
        onOpenChange={setRevoking}
        open={revoking}
        placeholder={tDetail('revokePlaceholder')}
        title={tDetail('revokeTitle')}
      />
    </div>
  )
}
