'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { type MemberDetail, getOrganizationMemberDetail } from '@/actions/organizations/members'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { LucideIcon } from '@/components/icons/lucide'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmailText } from '@/components/ui/email-text'
import { FilterBar } from '@/components/ui/filter-bar'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { type OrganizationMembershipRole, canManageMemberRole, timestampMillis } from '@/db/queries/organization'
import { type User } from '@/db/queries/user'
import { useReturnFocus } from '@/hooks/use-return-focus'

import { ChangeRoleDialog } from './change-role-dialog'
import { LeaveOrganizationDialog } from './leave-organization-dialog'
import { MemberDrawer } from './member-drawer'
import { RemoveMemberDialog } from './remove-member-dialog'
import { useMemberError } from './use-member-error'
import { formatRoleLabel, getDisplayName } from './utils'

type Member = OrganizationPanelData['members'][number]
type Dialog = { kind: 'leave' } | { kind: 'remove' | 'role'; member: Member }

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
  const { dateTime } = useFormatter()
  const t = useTranslations('Organization')
  const memberError = useMemberError()
  const { remember, restore } = useReturnFocus()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | OrganizationMembershipRole>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'pending'>('all')
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
  const self = members.find(member => member.user.id === currentUserId)

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

  const handleLeft = (user: User) => {
    onSyncUser?.(user)
    push('/dashboard')
  }

  const columns: DataTableColumn<Member>[] = [
    {
      cell: member => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8 rounded-full">
            {member.user.avatarUrl && <AvatarImage alt="" src={member.user.avatarUrl} />}
            <AvatarFallback className="rounded-full">
              {(member.fullName || member.user.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <button
              className="cursor-pointer self-start text-left font-medium wrap-anywhere hover:underline focus-visible:focus-ring"
              onClick={() => openDetail(member)}
              type="button"
            >
              {getDisplayName(member.user)}
              {member.user.id === currentUserId && (
                <span className="ml-2 font-normal text-muted-foreground">{t('you')}</span>
              )}
            </button>
            <EmailText className="text-xs text-muted-foreground" email={member.user.email} />
          </div>
        </div>
      ),
      header: t('members'),
      id: 'name',
      sortValue: member => getDisplayName(member.user),
    },
    {
      cell: member => formatRoleLabel(member.role, t),
      header: t('role'),
      id: 'role',
      sortValue: member => formatRoleLabel(member.role, t),
    },
    ...(platform
      ? []
      : [
          {
            cell: (member: Member) => (
              <StatusBadge tone={member.isPending ? 'warning' : 'success'}>
                {member.isPending ? t('statusPending') : t('statusJoined')}
              </StatusBadge>
            ),
            header: t('status'),
            id: 'status',
            sortValue: (member: Member) => (member.isPending ? 1 : 0),
          } satisfies DataTableColumn<Member>,
        ]),
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
  ]

  const platformFilters = (
    <FilterBar
      active={roleFilter !== 'all' || search.length > 0}
      count={Number(roleFilter !== 'all')}
      onClear={clearFilters}
      search={
        <SearchInput
          aria-label={t('searchMembers')}
          className="w-full sm:w-64"
          hotkey="/"
          onValueChange={setSearch}
          placeholder={t('searchMembers')}
          size="sm"
          value={search}
        />
      }
      size="sm"
    >
      <Select onValueChange={value => setRoleFilter(value as typeof roleFilter)} value={roleFilter}>
        <SelectTrigger aria-label={t('filterRole')} className="w-auto gap-1.5" size="sm">
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
    </FilterBar>
  )

  return (
    <>
      <div className="flex flex-col gap-6 outline-none" ref={containerRef} tabIndex={-1}>
        <DataTable
          columns={columns}
          emptyDescription={members.length === 0 ? t('noMembersDescription') : t('noMembersFilteredDescription')}
          emptyTitle={members.length === 0 ? t('noMembers') : t('noMembersFiltered')}
          filters={platform ? platformFilters : undefined}
          rail={
            platform
              ? undefined
              : {
                  groups: [
                    {
                      id: 'role',
                      label: t('filterRole'),
                      onChange: ([value]) => setRoleFilter((value as OrganizationMembershipRole | undefined) ?? 'all'),
                      options: ROLE_FILTERS.map(role => ({
                        count: members.filter(m => m.role === role && memberMatches(m, { role: false })).length,
                        label: formatRoleLabel(role, t),
                        value: role,
                      })),
                      selection: 'single',
                      values: roleFilter === 'all' ? [] : [roleFilter],
                    },
                    {
                      id: 'status',
                      label: t('filterStatus'),
                      onChange: ([value]) => setStatusFilter((value as 'active' | 'pending' | undefined) ?? 'all'),
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
                      selection: 'single',
                      values: statusFilter === 'all' ? [] : [statusFilter],
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
                }
          }
          getRowId={member => member.id}
          label={t('membersTitle')}
          rowActions={member => {
            const isSelf = member.user.id === currentUserId
            const canRemove = !isSelf && canManageMemberRole(managerRole, member.role)
            const canChangeRole = isOrgAdmin && !isSelf && member.role !== 'admin'
            const canLeave = isSelf && !platform && member.role !== 'admin'

            if (!(canRemove || canChangeRole || canLeave)) return null

            return (
              <div className="flex items-center justify-end gap-1">
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
                    <DropdownMenuItem onSelect={() => openDetail(member)}>
                      <LucideIcon name="user" />
                      {t('viewDetails')}
                    </DropdownMenuItem>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => openDialog({ kind: 'remove', member })} variant="destructive">
                          <LucideIcon name="trash-2" />
                          {t('removeMember')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          }}
          rows={rows}
        />
      </div>

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
        <LeaveOrganizationDialog
          onCloseAutoFocus={event => restore(event, containerRef.current)}
          onLeft={handleLeft}
          onOpenChange={handleDialog}
          open={dialog?.kind === 'leave'}
          organizationId={self?.organizationId ?? 0}
          organizationName={organizationName}
        />
      )}
    </>
  )
}
