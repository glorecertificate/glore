'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'

import { revokeCertificate } from '@/actions/certificates/review'
import { MIN_REASON_LENGTH, ReasonDialog } from '@/components/features/certificates/reason-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { toast } from '@/components/ui/toast'
import { type AdminCertificateRow } from '@/db/queries/admin-certificate'
import { useReturnFocus } from '@/hooks/use-return-focus'
import { fullName } from '@/lib/utils'

import { listFocusTarget } from './utils'

export const AdminCertificateActions = ({ certificate }: { certificate: AdminCertificateRow }) => {
  const t = useTranslations('Admin.certificates')
  const tDetail = useTranslations('CertificateDetail')
  const { refresh } = useRouter()
  const [pending, startTransition] = useTransition()
  const [revoking, setRevoking] = useState(false)
  const { remember, restore } = useReturnFocus()

  const revoke = (reason: string) =>
    startTransition(async () => {
      const { error } = await revokeCertificate(certificate.id, { reason })
      setRevoking(false)
      if (error) return void toast.error(tDetail('revokeError'))
      toast.success(tDetail('revoked'))
      return refresh()
    })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${t('actions')}: ${certificate.code ?? fullName(certificate.holder) ?? certificate.id}`}
            disabled={pending}
            size="icon"
            variant="ghost"
          >
            <LucideIcon name="ellipsis" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/certificates/${certificate.id}`}>
              <LucideIcon name="eye" />
              {t('view')}
            </Link>
          </DropdownMenuItem>
          {certificate.status === 'approved' && (
            <DropdownMenuItem
              onSelect={() => {
                remember()
                setRevoking(true)
              }}
              variant="destructive"
            >
              <LucideIcon name="shield-off" />
              {tDetail('revoke')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
        onCloseAutoFocus={event => restore(event, listFocusTarget)}
        onOpenChange={setRevoking}
        open={revoking}
        placeholder={tDetail('revokePlaceholder')}
        title={tDetail('revokeTitle')}
      />
    </>
  )
}
