'use client'

import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { copyOrganizationInviteLink, revokeOrganizationInviteLink } from '@/actions/organizations/invitations'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { LucideIcon } from '@/components/icons/lucide'
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
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { timestampMillis } from '@/db/queries/organization'
import { useReturnFocus } from '@/hooks/use-return-focus'

import { CopyLinkButton } from './copy-link-button'
import { InviteLinkDialog } from './invite-link-dialog'
import { INVITE_LINK_STATUS } from './status'
import { TabHeader } from './tab-header'
import { formatRoleLabel } from './utils'

type InviteLink = OrganizationPanelData['inviteLinks'][number]

interface InviteLinksProps {
  links: OrganizationPanelData['inviteLinks']
  onRefresh: () => void
}

export const InviteLinks = ({ links, onRefresh }: InviteLinksProps) => {
  const { locale } = useI18n()
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()
  const { remember, restore } = useReturnFocus()
  const containerRef = useRef<HTMLDivElement>(null)

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
      <div className="flex flex-col gap-6 outline-none" ref={containerRef} tabIndex={-1}>
        <TabHeader
          actions={
            <Button
              onClick={() => {
                remember()
                setCreateOpen(true)
              }}
              size="sm"
              variant="outline"
            >
              <LucideIcon name="link" />
              {t('createLink')}
            </Button>
          }
          as="h3"
          description={t('linksDescription')}
          title={t('linksTitle')}
        />

        <DataTable
          columns={[
            {
              cell: link => (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{formatRoleLabel(link.role, tOrganization)}</span>
                  <Badge variant="outline">{link.requiresApproval ? t('approvalRequired') : t('approvalNone')}</Badge>
                </div>
              ),
              header: t('colRole'),
              id: 'role',
              sortValue: link => formatRoleLabel(link.role, tOrganization),
            },
            {
              cell: link => (
                <div className="flex flex-col gap-0.5">
                  <span>
                    {link.maxUses === null
                      ? t('usesUnlimited', { uses: link.uses })
                      : t('usesLimited', { max: link.maxUses, uses: link.uses })}
                  </span>
                  <span className="type-caption text-muted-foreground">
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
                  <StatusBadge tone={INVITE_LINK_STATUS[link.state].tone}>
                    {t(INVITE_LINK_STATUS[link.state].labelKey)}
                  </StatusBadge>
                  {link.creatorName && (
                    <span className="type-caption text-muted-foreground">
                      {t('createdBy', { name: link.creatorName })}
                    </span>
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
                <Button
                  onClick={() => {
                    remember()
                    setRevokeTarget(link)
                  }}
                  size="sm"
                  variant="outline"
                >
                  {t('revoke')}
                </Button>
              </div>
            ) : null
          }
          rows={links}
        />
      </div>

      <InviteLinkDialog
        onCreated={onRefresh}
        onCloseAutoFocus={event => restore(event, containerRef.current)}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />

      <AlertDialog
        onOpenChange={open => {
          if (open) return
          setRevokeTarget(null)
        }}
        open={Boolean(revokeTarget)}
      >
        <AlertDialogContent onCloseAutoFocus={event => restore(event, containerRef.current)}>
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
