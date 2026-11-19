'use client'

import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import {
  copyOrganizationInvitationLink,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
} from '@/actions/organizations/invitations'
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
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmailText } from '@/components/ui/email-text'
import { FilterBar } from '@/components/ui/filter-bar'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { canManageInvitation, timestampMillis } from '@/db/queries/organization'
import { useReturnFocus } from '@/hooks/use-return-focus'

import { CopyLinkButton } from './copy-link-button'
import { InviteLinks } from './invite-links'
import { INVITATION_STATUS } from './status'
import { formatRoleLabel } from './utils'

type Invitation = OrganizationPanelData['invitations'][number]

const isOpen = ({ state }: Invitation) => state === 'pending'
const isActionable = ({ state }: Invitation) => state === 'pending' || state === 'expired'

const FILTER_LABELS = {
  accepted: 'filterAccepted',
  expired: 'filterExpired',
  open: 'filterOpen',
} as const

const STATE_RANK: Record<Invitation['state'], number> = {
  accepted: 2,
  declined: 3,
  expired: 1,
  pending: 0,
  revoked: 4,
}

type InvitationFilter = 'accepted' | 'all' | 'expired' | 'open'

const FILTERS: Record<InvitationFilter, (invitation: Invitation) => boolean> = {
  accepted: ({ state }) => state === 'accepted',
  all: () => true,
  expired: ({ state }) => state === 'expired',
  open: isOpen,
}

interface OrganizationInvitationsProps {
  currentUserId: string
  invitations: OrganizationPanelData['invitations']
  isOrgAdmin: boolean
  onRefresh: () => void
  inviteLinks?: OrganizationPanelData['inviteLinks']
  organizationId?: number
}

export const OrganizationInvitations = ({
  currentUserId,
  inviteLinks,
  invitations,
  isOrgAdmin,
  onRefresh,
  organizationId,
}: OrganizationInvitationsProps) => {
  const { locale } = useI18n()
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()
  const { remember, restore } = useReturnFocus()
  const containerRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InvitationFilter>('all')
  const [activeId, setActiveId] = useState<number | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const formatDate = (value: string) => dateFormatter.format(new Date(timestampMillis(value)))
  const needle = search.trim().toLowerCase()
  const searched = invitations.filter(({ email }) => !needle || email.toLowerCase().includes(needle))
  const rows = searched.filter(FILTERS[filter]).toSorted((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state])

  const canManage = (invitation: Invitation) =>
    canManageInvitation(isOrgAdmin ? 'admin' : 'representative', invitation, currentUserId)

  const platform = organizationId !== undefined

  const platformFilters = (
    <FilterBar
      active={filter !== 'all' || search.trim() !== ''}
      count={Number(filter !== 'all')}
      onClear={() => {
        setFilter('all')
        setSearch('')
      }}
      search={
        <SearchInput
          aria-label={t('searchPlaceholder')}
          className="w-full sm:w-64"
          onValueChange={setSearch}
          placeholder={t('searchPlaceholder')}
          size="sm"
          value={search}
        />
      }
      size="sm"
    >
      <Select onValueChange={value => setFilter(value as InvitationFilter)} value={filter}>
        <SelectTrigger aria-label={t('filterLabel')} className="w-auto gap-1.5" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filterAll')}</SelectItem>
          {(['open', 'expired', 'accepted'] as const).map(key => (
            <SelectItem key={key} value={key}>
              {`${t(FILTER_LABELS[key])} (${searched.filter(FILTERS[key]).length})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterBar>
  )

  const handleResend = async (invitation: Invitation) => {
    setActiveId(invitation.id)
    const { error } = await resendOrganizationInvitation(invitation.id, organizationId)
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
    const { error } = await revokeOrganizationInvitation(revokeTarget.id, organizationId)
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
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6 outline-none" ref={containerRef} tabIndex={-1}>
          <DataTable
            columns={[
              {
                cell: invitation => (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <EmailText className="font-medium" email={invitation.email} />
                    {invitation.inviterName && (
                      <span className="type-caption text-muted-foreground">
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
                cell: invitation => formatRoleLabel(invitation.role, tOrganization),
                header: t('colRole'),
                id: 'role',
                sortValue: invitation => formatRoleLabel(invitation.role, tOrganization),
              },
              {
                cell: invitation => (
                  <div className="flex flex-col gap-1">
                    <StatusBadge tone={INVITATION_STATUS[invitation.state].tone}>
                      {t(INVITATION_STATUS[invitation.state].labelKey)}
                    </StatusBadge>
                    <span className="type-caption text-muted-foreground">{expiryText(invitation)}</span>
                  </div>
                ),
                header: t('colStatus'),
                id: 'status',
                sortValue: invitation => invitation.state,
              },
            ]}
            emptyDescription={t('emptyDescription')}
            emptyTitle={t('empty')}
            filters={platform ? platformFilters : undefined}
            rail={
              platform
                ? undefined
                : {
                    groups: [
                      {
                        id: 'status',
                        label: t('filterLabel'),
                        onChange: value => setFilter((value as InvitationFilter | null) ?? 'all'),
                        options: (['open', 'expired', 'accepted'] as const).map(key => ({
                          count: searched.filter(FILTERS[key]).length,
                          label: t(FILTER_LABELS[key]),
                          value: key,
                        })),
                        value: filter === 'all' ? null : filter,
                      },
                    ],
                    onReset: () => {
                      setFilter('all')
                      setSearch('')
                    },
                    search: () => (
                      <SearchInput
                        aria-label={t('searchPlaceholder')}
                        className="w-full"
                        onValueChange={setSearch}
                        placeholder={t('searchPlaceholder')}
                        value={search}
                      />
                    ),
                    searchActive: search.trim() !== '',
                  }
            }
            getRowId={invitation => invitation.id}
            label={t('title')}
            rowActions={invitation =>
              isActionable(invitation) && canManage(invitation) ? (
                <div className="flex items-center justify-end gap-1">
                  {invitation.state === 'pending' && (
                    <CopyLinkButton
                      label={t('copyLink')}
                      load={() => copyOrganizationInvitationLink(invitation.id, organizationId)}
                    />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={t('rowActions', { email: invitation.email })}
                        disabled={activeId === invitation.id}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <LucideIcon name="ellipsis" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleResend(invitation)}>
                        <LucideIcon name="send" />
                        {t('resend')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          remember()
                          setRevokeTarget(invitation)
                        }}
                        variant="destructive"
                      >
                        <LucideIcon name="ban" />
                        {t('revoke')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null
            }
            rows={rows}
          />
        </div>

        {inviteLinks && <InviteLinks links={inviteLinks} onRefresh={onRefresh} />}
      </div>

      <AlertDialog
        onOpenChange={open => {
          if (open) return
          setRevokeTarget(null)
        }}
        open={Boolean(revokeTarget)}
      >
        <AlertDialogContent onCloseAutoFocus={event => restore(event, containerRef.current)}>
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
