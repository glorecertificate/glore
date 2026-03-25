'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowUpDownIcon, CalendarIcon, CheckIcon, FilterIcon, ShieldIcon, UserIcon, UserPlusIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  deleteTeamMember,
  getTeamMembers,
  inviteTeamMember,
  resendInvitation,
  updateTeamMemberRole,
} from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type User } from '@/db/queries/user'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'

import {
  DeleteDialog,
  TeamInviteDialog,
  TeamMemberRow,
  type TeamRole,
  type TeamStatus,
  getDisplayName,
  getUserRole,
  getUserStatus,
} from './team-items'

type SortField = 'name' | 'role' | 'date'

export const AdminTeam = ({ users: initialUsers }: { users: User[] }) => {
  const t = useTranslations('Admin.team')
  const { locale } = useI18n()
  const { user: currentUser } = useSession()

  const [users, setUsers] = useState(initialUsers)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortField>('name')
  const [filterRole, setFilterRole] = useState<TeamRole | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TeamStatus | 'all'>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const activeUsers = useMemo(() => users.filter(u => !deletedIds.has(u.id)), [users, deletedIds])

  const displayUsers = useMemo(() => {
    let filtered = activeUsers

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => getUserRole(u) === filterRole)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => getUserStatus(u) === filterStatus)
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return getDisplayName(a).localeCompare(getDisplayName(b))
      if (sortBy === 'role') return getUserRole(a).localeCompare(getUserRole(b))
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [activeUsers, sortBy, filterRole, filterStatus])

  const refreshTeam = useCallback(async () => {
    const { data } = await getTeamMembers({ cache: false })
    if (data) setUsers(data)
  }, [])

  const handleInvite = useCallback(
    async (data: { firstName: string; lastName: string; email: string; role: TeamRole; locale: Locale }) => {
      const { error } = await inviteTeamMember(data)

      if (error) {
        console.error(error)
        toast.error(t('inviteError'))
        return
      }

      toast.success(t('inviteSuccess', { email: data.email }))
      refreshTeam()
    },
    [t, refreshTeam]
  )

  const handleChangeRole = useCallback(
    async (user: User, role: TeamRole) => {
      const { error } = await updateTeamMemberRole(user.id, role)

      if (error) {
        toast.error(error)
        return
      }

      toast.success(t('roleUpdateSuccess', { name: getDisplayName(user), role: t(`role_${role}`).toLowerCase() }))
      refreshTeam()
    },
    [t, refreshTeam]
  )

  const handleResend = useCallback(
    async (user: User) => {
      const { error, data } = await resendInvitation(user.id)

      if (error) {
        toast.error(t('resendError'))
        return
      }

      toast.success(t('resendSuccess', { email: data?.email ?? user.email }))
    },
    [t]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    const { error } = await deleteTeamMember(deleteTarget.id)

    if (error) {
      toast.error(error)
      return
    }

    setDeletedIds(prev => new Set(prev).add(deleteTarget.id))
    setDeleteTarget(null)
    toast.success(t('deleteSuccess'))
  }, [deleteTarget, t])

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <ArrowUpDownIcon className="mr-1.5 size-3.5" />
                {t(`sort_${sortBy}`)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                <UserIcon className="mr-2 size-3.5" />
                {t('sort_name')}
                {sortBy === 'name' && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('role')}>
                <ShieldIcon className="mr-2 size-3.5" />
                {t('sort_role')}
                {sortBy === 'role' && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                <CalendarIcon className="mr-2 size-3.5" />
                {t('sort_date')}
                {sortBy === 'date' && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select onValueChange={v => setFilterRole(v as TeamRole | 'all')} value={filterRole}>
            <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed px-3 text-sm">
              <FilterIcon className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter_allRoles')}</SelectItem>
              <SelectItem value="admin">{t('role_admin')}</SelectItem>
              <SelectItem value="editor">{t('role_editor')}</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={v => setFilterStatus(v as TeamStatus | 'all')} value={filterStatus}>
            <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed px-3 text-sm">
              <FilterIcon className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter_allStatuses')}</SelectItem>
              <SelectItem value="joined">{t('status_joined')}</SelectItem>
              <SelectItem value="pending">{t('status_pending')}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              className="h-8"
              onClick={() => {
                setFilterRole('all')
                setFilterStatus('all')
              }}
              size="sm"
              variant="ghost"
            >
              {t('clearFilters')}
            </Button>
          )}
        </div>

        <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
          <UserPlusIcon className="mr-1.5 size-3.5" />
          {t('inviteMember')}
        </Button>
      </div>

      <div className="space-y-2">
        {displayUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <UserIcon className="mb-3 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">{t('noMembers')}</p>
            {hasActiveFilters && <p className="mt-1 text-xs text-muted-foreground/70">{t('tryAdjustingFilters')}</p>}
          </div>
        ) : (
          displayUsers.map(user => (
            <TeamMemberRow
              isCurrentUser={user.id === currentUser.id}
              key={user.id}
              onChangeRole={handleChangeRole}
              onDelete={setDeleteTarget}
              onResend={handleResend}
              user={user}
            />
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('memberCount', { count: displayUsers.length, total: activeUsers.length })}
      </p>

      <TeamInviteDialog defaultLocale={locale} onInvite={handleInvite} onOpenChange={setInviteOpen} open={inviteOpen} />

      <DeleteDialog
        onConfirm={handleDelete}
        onOpenChange={open => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
        user={deleteTarget}
      />
    </div>
  )
}
