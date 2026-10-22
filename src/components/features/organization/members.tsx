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
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type OrganizationMembershipRole, canManageMemberRole, timestampMillis } from '@/db/queries/organization'
import { type User } from '@/db/queries/user'

import { ChangeRoleDialog } from './change-role-dialog'
import { InviteMemberDialog } from './invite-dialog'
import { LeaveOrganizationDialog } from './leave-organization-dialog'
import { MemberDrawer } from './member-drawer'
import { RemoveMemberDialog } from './remove-member-dialog'
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

  const platform = organizationId !== undefined
  const managerRole = isOrgAdmin ? 'admin' : 'representative'
  const availableInviteRoles = isOrgAdmin ? [...MANAGEABLE_MEMBER_ROLES] : [...REPRESENTATIVE_INVITE_ROLES]
  const self = members.find(member => member.user.id === currentUserId)
  const candidates = members.filter(member => member.isRepresentative && !member.isPending)

  const needle = search.trim().toLowerCase()
  const rows = members.filter(member => {
    if (roleFilter !== 'all' && member.role !== roleFilter) return false
    if (statusFilter === 'pending' && !member.isPending) return false
    if (statusFilter === 'active' && member.isPending) return false
    if (!needle) return true
    return [getDisplayName(member.user), member.user.email, member.user.username ?? ''].some(value =>
      value.toLowerCase().includes(needle)
    )
  })

  const openDetail = async (member: Member) => {
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

  const handleDialog = (open: boolean) => {
    if (!open) setDialog(null)
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('membersTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('membersDescription')}</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
            <LucideIcon name="user-plus" />
            {t('inviteMember')}
          </Button>
        </div>

        <DataTable
          columns={[
            {
              cell: member => (
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-full">
                    {member.user.avatarUrl && <AvatarImage alt="" src={member.user.avatarUrl} />}
                    <AvatarFallback className="rounded-full">
                      {(member.fullName || member.user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{getDisplayName(member.user)}</span>
                    {member.user.id === currentUserId && (
                      <Badge className="w-fit" size="sm" variant="outline">
                        {t('you')}
                      </Badge>
                    )}
                  </div>
                </div>
              ),
              header: t('members'),
              id: 'name',
              sortValue: member => getDisplayName(member.user),
            },
            {
              cell: member => member.user.email,
              header: t('email'),
              id: 'email',
              sortValue: member => member.user.email,
            },
            {
              cell: member => <Badge variant="ghost">{formatRoleLabel(member.role, t)}</Badge>,
              header: t('role'),
              id: 'role',
              sortValue: member => formatRoleLabel(member.role, t),
            },
            {
              cell: member => (
                <Badge variant={member.isPending ? 'warning' : 'success'}>
                  {member.isPending ? t('statusPending') : t('statusJoined')}
                </Badge>
              ),
              header: t('status'),
              id: 'status',
              sortValue: member => (member.isPending ? 1 : 0),
            },
            {
              cell: member => dateTime(new Date(timestampMillis(member.createdAt)), { dateStyle: 'medium' }),
              header: t('joined'),
              id: 'joined',
              sortValue: member => new Date(timestampMillis(member.createdAt)),
            },
          ]}
          emptyDescription={members.length === 0 ? t('noMembersDescription') : t('noMembersFilteredDescription')}
          emptyTitle={members.length === 0 ? t('noMembers') : t('noMembersFiltered')}
          filters={
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <SearchInput
                aria-label={t('searchMembers')}
                className="h-8 w-full sm:w-64"
                onValueChange={setSearch}
                placeholder={t('searchMembers')}
                value={search}
              />
              <Select onValueChange={value => setRoleFilter(value as typeof roleFilter)} value={roleFilter}>
                <SelectTrigger aria-label={t('filterRole')} className="h-8 w-auto gap-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allRoles')}</SelectItem>
                  {ROLE_FILTERS.map(role => (
                    <SelectItem key={role} value={role}>
                      {formatRoleLabel(role, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={value => setStatusFilter(value as typeof statusFilter)} value={statusFilter}>
                <SelectTrigger aria-label={t('filterStatus')} className="h-8 w-auto gap-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('statusJoined')}</SelectItem>
                  <SelectItem value="pending">{t('statusPending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
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
                {(canRemove || canChangeRole || canLeave) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={t('memberActions', { name: getDisplayName(member.user) })}
                        size="icon"
                        variant="ghost"
                      >
                        <LucideIcon name="ellipsis" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canChangeRole && (
                        <DropdownMenuItem onSelect={() => setDialog({ kind: 'role', member })}>
                          <LucideIcon name="user-cog" />
                          {t('changeRole')}
                        </DropdownMenuItem>
                      )}
                      {canLeave && (
                        <DropdownMenuItem onSelect={() => setDialog({ kind: 'leave' })} variant="destructive">
                          <LucideIcon name="log-out" />
                          {t('leaveOrganization')}
                        </DropdownMenuItem>
                      )}
                      {canRemove && (
                        <>
                          {canChangeRole && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            onSelect={() => setDialog({ kind: 'remove', member })}
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
          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{t('transferTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('transferHelp')}</p>
            </div>
            <Button onClick={() => setDialog({ kind: 'transfer' })} size="sm" variant="outline">
              {t('transferOwnership')}
            </Button>
          </div>
        )}
      </div>

      <InviteMemberDialog
        allowedRoles={availableInviteRoles}
        defaultLocale={locale}
        onInvite={input => inviteOrganizationMembers(input, organizationId)}
        onOpenChange={setInviteOpen}
        onSent={onRefresh}
        open={inviteOpen}
      />

      <MemberDrawer
        detail={drawer.data}
        errorMessage={drawer.error}
        loading={drawer.loading}
        onOpenChange={closeDrawer}
        open={drawer.open}
      />

      <ChangeRoleDialog
        key={dialog?.kind === 'role' ? dialog.member.id : 'role'}
        member={dialog?.kind === 'role' ? dialog.member : null}
        onDone={onRefresh}
        onOpenChange={handleDialog}
        organizationId={organizationId}
      />
      <RemoveMemberDialog
        member={dialog?.kind === 'remove' ? dialog.member : null}
        onDone={onRefresh}
        onOpenChange={handleDialog}
        organizationId={organizationId}
      />
      {!platform && (
        <>
          <LeaveOrganizationDialog
            onLeft={handleLeft}
            onOpenChange={handleDialog}
            open={dialog?.kind === 'leave'}
            organizationId={self?.organizationId ?? 0}
            organizationName={organizationName}
          />
          <TransferOwnershipDialog
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
