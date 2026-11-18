'use client'

import { useState } from 'react'

import { type Locale, useFormatter, useTranslations } from 'next-intl'

import {
  deleteTeamMember,
  getTeamMembers,
  inviteTeamMember,
  resendInvitation,
  updateTeamMemberRole,
} from '@/actions/admin/team'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { type TeamMember } from '@/db/queries/admin-user'
import { type User } from '@/db/queries/user'

import { useAdminDialog } from './dialog-provider'
import {
  DeleteDialog,
  ROLE_ICONS,
  TeamInviteDialog,
  TeamMemberActions,
  type TeamRole,
  type TeamStatus,
  getDisplayName,
  getUserRole,
  getUserStatus,
} from './team-items'
import { useAdminError } from './use-admin-error'
import { listFocusTarget } from './utils'

export const AdminTeam = ({ users: initialUsers }: { users: TeamMember[] }) => {
  const t = useTranslations('Admin.team')
  const { dateTime } = useFormatter()
  const { locale } = useI18n()
  const { user: currentUser } = useSession()
  const adminError = useAdminError()

  const [users, setUsers] = useState(initialUsers)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<TeamRole | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TeamStatus | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const { close, current, remember, restore } = useAdminDialog()
  const returnFocus = (event: Event) => restore(event, listFocusTarget)

  const activeUsers = users.filter(u => !deletedIds.has(u.id))

  const stats = {
    total: activeUsers.length,
    admins: activeUsers.filter(u => getUserRole(u) === 'admin').length,
    editors: activeUsers.filter(u => getUserRole(u) === 'editor').length,
    pending: activeUsers.filter(u => getUserStatus(u) === 'pending').length,
  }

  const displayUsers = (() => {
    let filtered = activeUsers

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => getUserRole(u) === filterRole)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => getUserStatus(u) === filterStatus)
    }

    return filtered
  })()

  const runBusy = async <T,>(action: () => Promise<T>) => {
    try {
      return await action()
    } finally {
      setBusyId(null)
    }
  }

  const refreshTeam = async () => {
    const { data } = await getTeamMembers({ cache: false })
    if (data) setUsers(data)
  }

  const handleInvite = async (data: {
    firstName: string
    lastName: string
    email: string
    role: TeamRole
    locale: Locale
  }) => {
    const { error } = await inviteTeamMember(data)

    if (error) {
      toast.error(adminError(error.code))
      return false
    }

    toast.success(t('inviteSuccess', { email: data.email }))
    refreshTeam()
    return true
  }

  const handleChangeRole = async (user: User, role: TeamRole) => {
    setBusyId(user.id)
    const { error } = await runBusy(() => updateTeamMemberRole(user.id, role))

    if (error) {
      toast.error(adminError(error.code))
      return
    }

    toast.success(t('roleUpdateSuccess', { name: getDisplayName(user), role }))
    await refreshTeam()
  }

  const handleResend = async (user: User) => {
    setBusyId(user.id)
    const { error, data } = await runBusy(() => resendInvitation(user.id))

    if (error) {
      toast.error(adminError(error.code))
      return
    }

    toast.success(t('resendSuccess', { email: data?.email ?? user.email }))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const { error } = await deleteTeamMember(deleteTarget.id)

    if (error) {
      toast.error(adminError(error.code))
      return
    }

    setDeletedIds(prev => new Set(prev).add(deleteTarget.id))
    setDeleteTarget(null)
    toast.success(t('deleteSuccess'))
  }

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all'

  const clearFilters = () => {
    setFilterRole('all')
    setFilterStatus('all')
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard accent="teal" icon="users" label={t('statMembers')} value={stats.total} />
        <StatCard accent="navy" icon="shield-check" label={t('statAdmins')} value={stats.admins} />
        <StatCard accent="green" icon="pencil" label={t('statEditors')} value={stats.editors} />
        <StatCard accent="amber" icon="clock" label={t('statPending')} value={stats.pending} />
      </div>

      <DataTable
        className="outline-none"
        tabIndex={-1}
        pageResetKey={`${filterRole}|${filterStatus}`}
        columns={[
          {
            cell: user => (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 rounded-full">
                  {user.avatarUrl && <AvatarImage alt="" src={user.avatarUrl} />}
                  <AvatarFallback className="rounded-full">
                    {user.initials || <LucideIcon name="user" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    {getDisplayName(user)}
                    {user.id === currentUser.id && (
                      <Badge size="sm" variant="outline">
                        {t('you')}
                      </Badge>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            ),
            header: t('columns.member'),
            id: 'name',
            sortValue: user => getDisplayName(user).toLowerCase(),
          },
          {
            cell: user => {
              const role = getUserRole(user)
              return (
                <Badge variant="ghost">
                  <LucideIcon name={ROLE_ICONS[role]} />
                  {t(`role_${role}`)}
                </Badge>
              )
            },
            header: t('columns.role'),
            id: 'role',
            sortValue: user => getUserRole(user),
          },
          {
            cell: user =>
              getUserStatus(user) === 'pending' ? (
                <StatusBadge icon="clock" tone="warning">
                  {t('status_pending')}
                </StatusBadge>
              ) : (
                <StatusBadge icon="circle-check" tone="success">
                  {t('status_joined')}
                </StatusBadge>
              ),
            header: t('columns.status'),
            id: 'status',
            sortValue: user => getUserStatus(user),
          },
          {
            cell: user => dateTime(new Date(user.createdAt), { dateStyle: 'medium' }),
            header: t('columns.added'),
            id: 'added',
            sortValue: user => new Date(user.createdAt),
          },
        ]}
        emptyDescription={hasActiveFilters ? t('tryAdjustingFilters') : t('noMembersDescription')}
        emptyTitle={hasActiveFilters ? t('noMembersFiltered') : t('noMembers')}
        filters={
          <FilterBar
            active={hasActiveFilters}
            onClear={clearFilters}
            count={Number(filterRole !== 'all') + Number(filterStatus !== 'all')}
            size="sm"
          >
            <Select onValueChange={v => setFilterRole(v as TeamRole | 'all')} value={filterRole}>
              <SelectTrigger aria-label={t('filterRoleLabel')} className="w-auto gap-1.5" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_allRoles')}</SelectItem>
                <SelectItem value="admin">{t('role_admin')}</SelectItem>
                <SelectItem value="editor">{t('role_editor')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={v => setFilterStatus(v as TeamStatus | 'all')} value={filterStatus}>
              <SelectTrigger aria-label={t('filterStatusLabel')} className="w-auto gap-1.5" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_allStatuses')}</SelectItem>
                <SelectItem value="joined">{t('status_joined')}</SelectItem>
                <SelectItem value="pending">{t('status_pending')}</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        }
        getRowId={user => user.id}
        label={t('tableLabel')}
        rowActions={user =>
          user.id === currentUser.id ? null : (
            <TeamMemberActions
              busy={busyId === user.id}
              onChangeRole={handleChangeRole}
              onDelete={member => {
                remember()
                setDeleteTarget(member)
              }}
              onResend={handleResend}
              user={user}
            />
          )
        }
        rows={displayUsers}
      />

      <TeamInviteDialog
        onCloseAutoFocus={returnFocus}
        defaultLocale={locale}
        onInvite={handleInvite}
        onOpenChange={value => !value && close()}
        open={current === 'invite'}
      />

      <DeleteDialog
        onCloseAutoFocus={returnFocus}
        onConfirm={handleDelete}
        onOpenChange={open => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
        user={deleteTarget}
      />
    </div>
  )
}
