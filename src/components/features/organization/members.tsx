'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { inviteOrganizationMembers } from '@/actions/organizations/invitations'
import { type MemberDetail, getOrganizationMemberDetail } from '@/actions/organizations/members'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmailText } from '@/components/ui/email-text'
import { SearchInput } from '@/components/ui/search'
import { StatusBadge } from '@/components/ui/status-badge'
import { type OrganizationMembershipRole, canManageMemberRole, timestampMillis } from '@/db/queries/organization'
import { type User } from '@/db/queries/user'
import { useReturnFocus } from '@/hooks/use-return-focus'

import { ChangeRoleDialog } from './change-role-dialog'
import { InviteMemberDialog } from './invite-dialog'
import { LeaveOrganizationDialog } from './leave-organization-dialog'
import { MemberDrawer } from './member-drawer'
import { RemoveMemberDialog } from './remove-member-dialog'
import { TabHeader } from './tab-header'
import { TransferOwnershipDialog } from './transfer-ownership-dialog'
import { useMemberError } from './use-member-error'
import { MANAGEABLE_MEMBER_ROLES, REPRESENTATIVE_INVITE_ROLES, formatRoleLabel, getDisplayName } from './utils'

type Member = OrganizationPanelData['members'][number]
type Dialog = { kind: 'leave' | 'transfer' } | { kind: 'remove' | 'role'; member: Member }

const ROLE_FILTERS: OrganizationMembershipRole[] = ['admin', 'representative', 'tutor', 'volunteer', 'learner']

interface OrganizationMembersProps {
  currentUserId: string
  isOrgAdmin: boolean
  members: OrganizationPanelData['members']
  onRefresh: () => void
  onSyncUser?: (user: User) => void
  organizationId?: number
  organizationName: string
}

export const OrganizationMembers = ({
  currentUserId,
  isOrgAdmin,
  members,
  onRefresh,
  onSyncUser,
  organizationId,
  organizationName,
}: OrganizationMembersProps) => {
  const { push } = useRouter()
  const { locale } = useI18n()
  const { dateTime } = useFormatter()
  const t = useTranslations('Organization')
  const memberError = useMemberError()
  const { remember, restore } = useReturnFocus()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | OrganizationMembershipRole>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'pending'>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [drawer, setDrawer] = useState<{
    data: MemberDetail | null
    error: string | null
    loading: boolean
    open: boolean
  }>({ data: null, error: null, loading: false, open: false })
  const drawerRequest = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const platform = organizationId !== undefined
  const managerRole = isOrgAdmin ? 'admin' : 'representative'
  const availableInviteRoles = isOrgAdmin ? [...MANAGEABLE_MEMBER_ROLES] : [...REPRESENTATIVE_INVITE_ROLES]
  const self = members.find(member => member.user.id === currentUserId)
  const candidates = members.filter(member => member.isRepresentative && !member.isPending)

  const needle = search.trim().toLowerCase()
  const memberMatches = (member: Member, { role = true, status = true }: { role?: boolean; status?: boolean } = {}) => {
    if (role && roleFilter !== 'all' && member.role !== roleFilter) return false
    if (status && statusFilter === 'pending' && !member.isPending) return false
    if (status && statusFilter === 'active' && member.isPending) return false
    if (!needle) return true
    return [getDisplayName(member.user), member.user.email, member.user.username ?? ''].some(value =>
      value.toLowerCase().includes(needle)
    )
  }

  const rows = members.filter(member => memberMatches(member))

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const openDetail = async (member: Member) => {
    remember()
    const request = ++drawerRequest.current
    setDrawer({ data: null, error: null, loading: true, open: true })
    const { data, error } = await getOrganizationMemberDetail(member.id, organizationId)
    if (request === drawerRequest.current) {
      setDrawer({ data, error: error ? memberError(error.code) : null, loading: false, open: true })
    }
  }

  const closeDrawer = (open: boolean) => {
    if (open) return
    drawerRequest.current += 1
    setDrawer(current => ({ ...current, open: false }))
  }

  const openDialog = (next: NonNullable<typeof dialog>) => {
    remember()
    setDialog(next)
  }

  const handleDialog = (open: boolean) => {
    if (open) return
    setDialog(null)
  }

  const handleRemoved = () => {
    remember(containerRef.current)
    onRefresh()
  }

  const handleOwnerChange = (user: User) => {
    onSyncUser?.(user)
    onRefresh()
  }

  const handleLeft = (user: User) => {
    onSyncUser?.(user)
    push('/dashboard')
  }

  return (
    <>
      <div className="flex flex-col gap-6 outline-none" ref={containerRef} tabIndex={-1}>
        <TabHeader
          actions={
            <Button
              onClick={() => {
                remember()
                setInviteOpen(true)
              }}
              size="sm"
              variant="brand"
            >
              <LucideIcon name="user-plus" />
              {t('inviteMember')}
            </Button>
          }
          description={t('membersDescription')}
          title={t('membersTitle')}
        />

        <DataTable
          columns={[
            {
              cell: member => (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8 rounded-full">
                    {member.user.avatarUrl && <AvatarImage alt="" src={member.user.avatarUrl} />}
                    <AvatarFallback className="rounded-full">
                      {(member.fullName || member.user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium wrap-anywhere">{getDisplayName(member.user)}</span>
                    {member.user.id === currentUserId && <Badge variant="outline">{t('you')}</Badge>}
                  </div>
                </div>
              ),
              header: t('members'),
              id: 'name',
              sortValue: member => getDisplayName(member.user),
            },
            {
              cell: member => <EmailText className="text-muted-foreground" email={member.user.email} />,
              header: t('email'),
              id: 'email',
              sortValue: member => member.user.email,
            },
            {
              cell: member => formatRoleLabel(member.role, t),
              header: t('role'),
              id: 'role',
              sortValue: member => formatRoleLabel(member.role, t),
            },
            {
              cell: member => (
                <StatusBadge tone={member.isPending ? 'warning' : 'success'}>
                  {member.isPending ? t('statusPending') : t('statusJoined')}
                </StatusBadge>
              ),
              header: t('status'),
              id: 'status',
              sortValue: member => (member.isPending ? 1 : 0),
            },
            {
              cell: member => (
                <span className="text-muted-foreground">
                  {dateTime(new Date(timestampMillis(member.createdAt)), { dateStyle: 'medium' })}
                </span>
              ),
              header: t('joined'),
              id: 'joined',
              sortValue: member => new Date(timestampMillis(member.createdAt)),
            },
          ]}
          emptyDescription={members.length === 0 ? t('noMembersDescription') : t('noMembersFilteredDescription')}
          emptyTitle={members.length === 0 ? t('noMembers') : t('noMembersFiltered')}
          rail={{
            groups: [
              {
                id: 'role',
                label: t('filterRole'),
                onChange: value => setRoleFilter((value as OrganizationMembershipRole | null) ?? 'all'),
                options: ROLE_FILTERS.map(role => ({
                  count: members.filter(m => m.role === role && memberMatches(m, { role: false })).length,
                  label: formatRoleLabel(role, t),
                  value: role,
                })),
                value: roleFilter === 'all' ? null : roleFilter,
              },
              {
                id: 'status',
                label: t('filterStatus'),
                onChange: value => setStatusFilter((value as 'active' | 'pending' | null) ?? 'all'),
                options: [
                  {
                    count: members.filter(m => !m.isPending && memberMatches(m, { status: false })).length,
                    label: t('statusJoined'),
                    tone: 'success',
                    value: 'active',
                  },
                  {
                    count: members.filter(m => m.isPending && memberMatches(m, { status: false })).length,
                    label: t('statusPending'),
                    tone: 'warning',
                    value: 'pending',
                  },
                ],
                value: statusFilter === 'all' ? null : statusFilter,
              },
            ],
            onReset: clearFilters,
            search: placement => (
              <SearchInput
                aria-label={t('searchMembers')}
                className="w-full"
                hotkey={placement === 'panel' ? '/' : undefined}
                onValueChange={setSearch}
                placeholder={t('searchMembers')}
                size="sm"
                value={search}
              />
            ),
            searchActive: search.length > 0,
          }}
          getRowId={member => member.id}
          label={t('membersTitle')}
          rowActions={member => {
            const isSelf = member.user.id === currentUserId
            const canRemove = !isSelf && canManageMemberRole(managerRole, member.role)
            const canChangeRole = isOrgAdmin && !isSelf && member.role !== 'admin'
            const canLeave = isSelf && !platform && member.role !== 'admin'

            return (
              <div className="flex items-center justify-end gap-1">
                <Button onClick={() => openDetail(member)} size="sm" variant="ghost">
                  {t('viewDetails')}
                </Button>
                {!(canRemove || canChangeRole || canLeave) && <span aria-hidden className="size-8" />}
                {(canRemove || canChangeRole || canLeave) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={t('memberActions', { name: getDisplayName(member.user) })}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <LucideIcon name="ellipsis" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canChangeRole && (
                        <DropdownMenuItem onSelect={() => openDialog({ kind: 'role', member })}>
                          <LucideIcon name="user-cog" />
                          {t('changeRole')}
                        </DropdownMenuItem>
                      )}
                      {canLeave && (
                        <DropdownMenuItem onSelect={() => openDialog({ kind: 'leave' })} variant="destructive">
                          <LucideIcon name="log-out" />
                          {t('leaveOrganization')}
                        </DropdownMenuItem>
                      )}
                      {canRemove && (
                        <>
                          {canChangeRole && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            onSelect={() => openDialog({ kind: 'remove', member })}
                            variant="destructive"
                          >
                            <LucideIcon name="trash-2" />
                            {t('removeMember')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          }}
          rows={rows}
        />

        {isOrgAdmin && !platform && self && (
          <div className="flex flex-col gap-3 rounded-lg border bg-surface-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="type-label">{t('transferTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('transferHelp')}</p>
            </div>
            <Button
              className="shrink-0"
              onClick={() => {
                remember()
                setDialog({ kind: 'transfer' })
              }}
              size="sm"
              variant="outline"
            >
              {t('transferOwnership')}
            </Button>
          </div>
        )}
      </div>

      <InviteMemberDialog
        allowedRoles={availableInviteRoles}
        defaultLocale={locale}
        onInvite={input => inviteOrganizationMembers(input, organizationId)}
        onCloseAutoFocus={event => restore(event, containerRef.current)}
        onOpenChange={setInviteOpen}
        onSent={onRefresh}
        open={inviteOpen}
      />

      <MemberDrawer
        detail={drawer.data}
        errorMessage={drawer.error}
        loading={drawer.loading}
        onCloseAutoFocus={event => restore(event, containerRef.current)}
        onOpenChange={closeDrawer}
        open={drawer.open}
      />

      <ChangeRoleDialog
        onCloseAutoFocus={event => restore(event, containerRef.current)}
        key={dialog?.kind === 'role' ? dialog.member.id : 'role'}
        member={dialog?.kind === 'role' ? dialog.member : null}
        onDone={onRefresh}
        onOpenChange={handleDialog}
        organizationId={organizationId}
      />
      <RemoveMemberDialog
        onCloseAutoFocus={event => restore(event, containerRef.current)}
        member={dialog?.kind === 'remove' ? dialog.member : null}
        onDone={handleRemoved}
        onOpenChange={handleDialog}
        organizationId={organizationId}
      />
      {!platform && (
        <>
          <LeaveOrganizationDialog
            onCloseAutoFocus={event => restore(event, containerRef.current)}
            onLeft={handleLeft}
            onOpenChange={handleDialog}
            open={dialog?.kind === 'leave'}
            organizationId={self?.organizationId ?? 0}
            organizationName={organizationName}
          />
          <TransferOwnershipDialog
            onCloseAutoFocus={event => restore(event, containerRef.current)}
            candidates={candidates}
            onOpenChange={handleDialog}
            onTransferred={handleOwnerChange}
            open={dialog?.kind === 'transfer'}
            organizationName={organizationName}
          />
        </>
      )}
    </>
  )
}
