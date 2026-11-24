'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { deleteAccount, getDeletionBlockers } from '@/actions/account/delete'
import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { SettingsSection } from '@/components/features/users/settings-section'
import { LucideIcon } from '@/components/icons/lucide'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { usePoll } from '@/hooks/use-poll'

const REFRESH_INTERVAL = 5 * 60_000

export const DeleteAccount = () => {
  const { impersonating, user } = useSession()
  const t = useTranslations('Users')
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const { data } = usePoll(getDeletionBlockers, { interval: REFRESH_INTERVAL })

  const blockers = data?.data ?? []
  const matches = confirmation.trim().toLowerCase() === user.email.toLowerCase()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    setConfirmation('')
  }

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault()
    setDeleting(true)
    const result = await deleteAccount(confirmation)
    if (result?.error) {
      setDeleting(false)
      toast.error(result.error.code === 'SOLE_ORG_ADMIN' ? t('deleteAccountBlockedAdmin') : t('deleteAccountError'))
    }
  }

  return (
    <SettingsSection description={t('dangerZoneDescription')} title={t('dangerZone')}>
      <AlertDialog onOpenChange={handleOpenChange} open={open}>
        <Card className="border-danger-border bg-danger-subtle">
          <CardHeader>
            <CardTitle className="type-heading text-danger-text">{t('deleteAccountTitle')}</CardTitle>
            <CardDescription className="text-danger-text">{t('deleteAccountDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImpersonationLockNote />
            {blockers.length > 0 && (
              <Banner data-testid="delete-blocked" className="bg-transparent" role="alert" variant="destructive">
                <div className="space-y-1">
                  <p className="flex items-center gap-1 font-medium text-danger-text">
                    <LucideIcon className="size-4" name="triangle-alert" />
                    {t('deleteAccountTransferTitle')}
                  </p>
                  <p className="text-danger-text">
                    {t('deleteAccountTransferDescription', {
                      organizations: blockers.map(({ name }) => name).join(', '),
                    })}
                  </p>
                  <Link className="text-danger-text underline underline-offset-4" href="/organization?tab=settings">
                    {t('deleteAccountTransferLink')}
                  </Link>
                </div>
              </Banner>
            )}
            <AlertDialogTrigger asChild>
              <Button disabled={blockers.length > 0 || impersonating} type="button" variant="destructive">
                {t('deleteAccount')}
              </Button>
            </AlertDialogTrigger>
          </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAccountConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteAccountConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">{t('deleteAccountConfirmLabel', { email: user.email })}</Label>
            <Input
              autoComplete="off"
              disabled={deleting}
              id="delete-confirmation"
              onChange={event => setConfirmation(event.target.value)}
              value={confirmation}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!matches}
              loading={deleting}
              loadingText={t('deleting')}
              onClick={handleDelete}
              variant="destructive"
            >
              {t('deleteAccount')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
