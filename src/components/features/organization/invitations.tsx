'use client'

import { useState } from 'react'

import { UserPlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  copyOrganizationInvitationLink,
  inviteOrganizationMembers,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
} from '@/actions/organizations/invitations'
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { type InvitationState, canManageInvitation, timestampMillis } from '@/db/queries/organization'

import { CopyLinkButton } from './copy-link-button'
import { InviteMemberDialog } from './invite-dialog'
import { InviteLinks } from './invite-links'
import { MANAGEABLE_MEMBER_ROLES, REPRESENTATIVE_INVITE_ROLES, formatRoleLabel } from './utils'

type Invitation = OrganizationPanelData['invitations'][number]

const isOpen = ({ state }: Invitation) => state === 'pending' || state === 'expired'

const STATE_BADGES = {
  accepted: 'success',
  declined: 'muted',
  expired: 'warning',
  pending: 'info',
  revoked: 'destructive',
} satisfies Record<InvitationState, React.ComponentProps<typeof Badge>['variant']>

interface OrganizationInvitationsProps {
  currentUserId: string
  inviteLinks: OrganizationPanelData['inviteLinks']
  invitations: OrganizationPanelData['invitations']
  isOrgAdmin: boolean
  onRefresh: () => void
}

export const OrganizationInvitations = ({
  currentUserId,
  inviteLinks,
  invitations,
  isOrgAdmin,
  onRefresh,
}: OrganizationInvitationsProps) => {
  const { locale } = useI18n()
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()

  const [filter, setFilter] = useState<'all' | 'open'>('open')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const formatDate = (value: string) => dateFormatter.format(new Date(timestampMillis(value)))
  const allowedRoles = isOrgAdmin ? [...MANAGEABLE_MEMBER_ROLES] : [...REPRESENTATIVE_INVITE_ROLES]
  const rows = filter === 'open' ? invitations.filter(isOpen) : invitations

  const canManage = (invitation: Invitation) =>
    canManageInvitation(isOrgAdmin ? 'admin' : 'representative', invitation, currentUserId)

  const handleResend = async (invitation: Invitation) => {
    setActiveId(invitation.id)
    const { error } = await resendOrganizationInvitation(invitation.id)
    setActiveId(null)

    if (error) {
      toast.error(errorMessage(error.code))
      return
    }

    toast.success(t('resent', { email: invitation.email }))
    onRefresh()
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return

    setActiveId(revokeTarget.id)
    const { error } = await revokeOrganizationInvitation(revokeTarget.id)
    setActiveId(null)

    if (error) {
      toast.error(errorMessage(error.code))
      return
    }

    toast.success(t('revoked', { email: revokeTarget.email }))
    setRevokeTarget(null)
    onRefresh()
  }

  const expiryText = (invitation: Invitation) => {
    if (invitation.state === 'pending') return t('expiresOn', { date: formatDate(invitation.expiresAt) })
    if (invitation.state === 'expired') return t('expiredOn', { date: formatDate(invitation.expiresAt) })
    if (invitation.state === 'accepted' && invitation.acceptedAt) {
      return t('acceptedOn', { date: formatDate(invitation.acceptedAt) })
    }
    if (invitation.state === 'declined' && invitation.declinedAt) {
      return t('declinedOn', { date: formatDate(invitation.declinedAt) })
    }
    if (invitation.state === 'revoked' && invitation.revokedAt) {
      return t('revokedOn', { date: formatDate(invitation.revokedAt) })
    }
    return null
  }

  return (
    <>
      <div className="space-y-10">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('title')}</h2>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
            <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
              <UserPlusIcon className="size-3.5" />
              {t('invitePeople')}
            </Button>
          </div>

          <DataTable
            columns={[
              {
                cell: invitation => (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium">{invitation.email}</span>
                    {invitation.inviterName && (
                      <span className="text-xs text-muted-foreground">
                        {t('invitedBy', { name: invitation.inviterName })}
                      </span>
                    )}
                  </div>
                ),
                header: t('colEmail'),
                id: 'email',
                sortValue: invitation => invitation.email,
              },
              {
                cell: invitation => <Badge variant="ghost">{formatRoleLabel(invitation.role, tOrganization)}</Badge>,
                header: t('colRole'),
                id: 'role',
                sortValue: invitation => formatRoleLabel(invitation.role, tOrganization),
              },
              {
                cell: invitation => (
                  <div className="flex flex-col gap-1">
                    <Badge variant={STATE_BADGES[invitation.state]}>{t(`state_${invitation.state}`)}</Badge>
                    <span className="text-xs text-muted-foreground">{expiryText(invitation)}</span>
                  </div>
                ),
                header: t('colStatus'),
                id: 'status',
                sortValue: invitation => invitation.state,
              },
            ]}
            emptyDescription={t('emptyDescription')}
            emptyTitle={t('empty')}
            filters={
              <SegmentedControl
                aria-label={t('filterLabel')}
                onValueChange={value => setFilter(value as 'all' | 'open')}
                value={filter}
              >
                <SegmentedControlItem value="open">{t('filterOpen')}</SegmentedControlItem>
                <SegmentedControlItem value="all">{t('filterAll')}</SegmentedControlItem>
              </SegmentedControl>
            }
            getRowId={invitation => invitation.id}
            label={t('title')}
            rowActions={invitation =>
              isOpen(invitation) && canManage(invitation) ? (
                <div className="flex items-center justify-end gap-2">
                  {invitation.state === 'pending' && (
                    <CopyLinkButton label={t('copyLink')} load={() => copyOrganizationInvitationLink(invitation.id)} />
                  )}
                  <Button
                    disabled={activeId === invitation.id}
                    onClick={() => handleResend(invitation)}
                    size="sm"
                    variant="outline"
                  >
                    {t('resend')}
                  </Button>
                  <Button
                    disabled={activeId === invitation.id}
                    onClick={() => setRevokeTarget(invitation)}
                    size="sm"
                    variant="outline"
                  >
                    {t('revoke')}
                  </Button>
                </div>
              ) : null
            }
            rows={rows}
          />
        </div>

        <InviteLinks links={inviteLinks} onRefresh={onRefresh} />
      </div>

      <InviteMemberDialog
        allowedRoles={allowedRoles}
        defaultLocale={locale}
        onInvite={inviteOrganizationMembers}
        onOpenChange={setInviteOpen}
        onSent={onRefresh}
        open={inviteOpen}
      />

      <AlertDialog onOpenChange={open => !open && setRevokeTarget(null)} open={Boolean(revokeTarget)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('revokeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('revokeDescription', { email: revokeTarget?.email ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activeId !== null}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              loading={activeId !== null}
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
