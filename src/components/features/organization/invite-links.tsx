'use client'

import { useState } from 'react'

import { LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { copyOrganizationInviteLink, revokeOrganizationInviteLink } from '@/actions/organizations/invitations'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { useI18n } from '@/components/providers/i18n'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { type InviteLinkState, timestampMillis } from '@/db/queries/organization'

import { CopyLinkButton } from './copy-link-button'
import { InviteLinkDialog } from './invite-link-dialog'
import { formatRoleLabel } from './utils'

type InviteLink = OrganizationPanelData['inviteLinks'][number]

const STATE_BADGES = {
  active: 'success',
  exhausted: 'muted',
  expired: 'warning',
  revoked: 'destructive',
} satisfies Record<InviteLinkState, React.ComponentProps<typeof Badge>['variant']>

interface InviteLinksProps {
  links: OrganizationPanelData['inviteLinks']
  onRefresh: () => void
}

export const InviteLinks = ({ links, onRefresh }: InviteLinksProps) => {
  const { locale } = useI18n()
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()

  const [createOpen, setCreateOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<InviteLink | null>(null)
  const [revoking, setRevoking] = useState(false)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const handleRevoke = async () => {
    if (!revokeTarget) return

    setRevoking(true)
    const { error } = await revokeOrganizationInviteLink(revokeTarget.id)
    setRevoking(false)

    if (error) {
      toast.error(errorMessage(error.code))
      return
    }

    toast.success(t('linkRevoked'))
    setRevokeTarget(null)
    onRefresh()
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('linksTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('linksDescription')}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
            <LinkIcon className="size-3.5" />
            {t('createLink')}
          </Button>
        </div>

        <DataTable
          columns={[
            {
              cell: link => (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="ghost">{formatRoleLabel(link.role, tOrganization)}</Badge>
                  <Badge variant="outline">{link.requiresApproval ? t('approvalRequired') : t('approvalNone')}</Badge>
                </div>
              ),
              header: t('colRole'),
              id: 'role',
              sortValue: link => formatRoleLabel(link.role, tOrganization),
            },
            {
              cell: link => (
                <div className="flex flex-col gap-0.5 text-sm">
                  <span>
                    {link.maxUses === null
                      ? t('usesUnlimited', { uses: link.uses })
                      : t('usesLimited', { max: link.maxUses, uses: link.uses })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {link.expiresAt
                      ? t(link.state === 'expired' ? 'expiredOn' : 'expiresOn', {
                          date: dateFormatter.format(new Date(timestampMillis(link.expiresAt))),
                        })
                      : t('neverExpires')}
                  </span>
                </div>
              ),
              header: t('colUsage'),
              id: 'usage',
              sortValue: link => link.uses,
            },
            {
              cell: link => (
                <div className="flex flex-col gap-1">
                  <Badge variant={STATE_BADGES[link.state]}>{t(`linkState_${link.state}`)}</Badge>
                  {link.creatorName && (
                    <span className="text-xs text-muted-foreground">{t('createdBy', { name: link.creatorName })}</span>
                  )}
                </div>
              ),
              header: t('colStatus'),
              id: 'status',
              sortValue: link => link.state,
            },
          ]}
          emptyDescription={t('linksEmptyDescription')}
          emptyTitle={t('linksEmpty')}
          getRowId={link => link.id}
          label={t('linksTitle')}
          rowActions={link =>
            link.state === 'active' ? (
              <div className="flex items-center justify-end gap-2">
                <CopyLinkButton label={t('copyLink')} load={() => copyOrganizationInviteLink(link.id)} />
                <Button onClick={() => setRevokeTarget(link)} size="sm" variant="outline">
                  {t('revoke')}
                </Button>
              </div>
            ) : null
          }
          rows={links}
        />
      </div>

      <InviteLinkDialog onCreated={onRefresh} onOpenChange={setCreateOpen} open={createOpen} />

      <AlertDialog onOpenChange={open => !open && setRevokeTarget(null)} open={Boolean(revokeTarget)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('revokeLinkTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('revokeLinkDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              loading={revoking}
              loadingText={t('revoking')}
              onClick={handleRevoke}
              variant="destructive"
            >
              {t('revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
