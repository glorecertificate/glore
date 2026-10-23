'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { EyeIcon, ShieldOffIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { assignCertificateTutor, unassignCertificate } from '@/actions/certificates/assignment'
import { revokeCertificate } from '@/actions/certificates/review'
import { type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { MIN_REASON_LENGTH, ReasonDialog } from '@/components/features/certificates/reason-dialog'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Certificate } from '@/db/queries/certificate'
import { useActionError } from '@/hooks/use-action-error'
import { fullName } from '@/lib/utils'

const UNASSIGNED = 'unassigned'

export const CertificateRowActions = ({
  certificate,
  onChanged,
  tutors,
}: {
  certificate: Certificate
  onChanged?: () => void
  tutors: OrgTutor[]
}) => {
  const t = useTranslations('Certificates.org')
  const tDetail = useTranslations('Certificates.detail')
  const tCommon = useTranslations('Common')
  const actionError = useActionError()
  const { impersonating } = useSession()
  const { refresh } = useRouter()
  const [pending, startTransition] = useTransition()
  const [revoking, setRevoking] = useState(false)

  const reassign = (tutorId: string) =>
    startTransition(async () => {
      const { error } =
        tutorId === UNASSIGNED
          ? await unassignCertificate(certificate.id)
          : await assignCertificateTutor(certificate.id, tutorId)
      if (error) return void toast.error(t('reassignError'))
      toast.success(t('reassigned'))
      onChanged?.()
      return refresh()
    })

  const revoke = (reason: string) =>
    startTransition(async () => {
      const { error } = await revokeCertificate(certificate.id, { reason })
      setRevoking(false)
      if (error) return void toast.error(actionError(error, tDetail('revokeError')))
      toast.success(tDetail('revoked'))
      onChanged?.()
      return refresh()
    })

  return (
    <div className="flex items-center justify-end gap-2">
      {certificate.isOpen && (
        <Select disabled={pending} onValueChange={reassign} value={certificate.reviewerId ?? UNASSIGNED}>
          <SelectTrigger aria-label={t('reassign')} className="h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>{t('noReviewer')}</SelectItem>
            {tutors.map(tutor => (
              <SelectItem key={tutor.id} value={tutor.id}>
                {fullName(tutor)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {certificate.isApproved && (
        <Button
          disabled={pending || impersonating}
          icon={ShieldOffIcon}
          onClick={() => setRevoking(true)}
          size="sm"
          title={impersonating ? tCommon('impersonationLocked') : undefined}
          variant="ghost"
        >
          {tDetail('revoke')}
        </Button>
      )}
      <Button asChild icon={EyeIcon} size="sm" variant="outline">
        <Link href={`/certificates/${certificate.id}`}>{t('view')}</Link>
      </Button>

      <ReasonDialog
        busy={pending}
        cancelLabel={tDetail('cancel')}
        confirmLabel={tDetail('revokeConfirm')}
        description={tDetail('revokeDescription')}
        hint={tDetail('revokeHint', { min: MIN_REASON_LENGTH })}
        id={`revoke-reason-${certificate.id}`}
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
