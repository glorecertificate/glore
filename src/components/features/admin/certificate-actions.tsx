'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { revokeCertificate } from '@/actions/certificates/review'
import { MIN_REASON_LENGTH, ReasonDialog } from '@/components/features/certificates/reason-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { type AdminCertificateRow } from '@/db/queries/admin-certificate'

export const AdminCertificateActions = ({ certificate }: { certificate: AdminCertificateRow }) => {
  const t = useTranslations('Admin.certificates')
  const tDetail = useTranslations('CertificateDetail')
  const { refresh } = useRouter()
  const [pending, startTransition] = useTransition()
  const [revoking, setRevoking] = useState(false)

  const revoke = (reason: string) =>
    startTransition(async () => {
      const { error } = await revokeCertificate(certificate.id, { reason })
      setRevoking(false)
      if (error) return void toast.error(tDetail('revokeError'))
      toast.success(tDetail('revoked'))
      return refresh()
    })

  return (
    <div className="flex items-center justify-end gap-2">
      {certificate.status === 'approved' && (
        <Button disabled={pending} onClick={() => setRevoking(true)} size="sm" variant="ghost">
          <LucideIcon name="shield-off" />
          {tDetail('revoke')}
        </Button>
      )}
      <Button asChild size="sm" variant="outline">
        <Link href={`/certificates/${certificate.id}`}>
          <LucideIcon name="eye" />
          {t('view')}
        </Link>
      </Button>

      <ReasonDialog
        busy={pending}
        cancelLabel={tDetail('cancel')}
        confirmLabel={tDetail('revokeConfirm')}
        description={tDetail('revokeDescription')}
        hint={tDetail('revokeHint', { min: MIN_REASON_LENGTH })}
        id={`admin-revoke-reason-${certificate.id}`}
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
