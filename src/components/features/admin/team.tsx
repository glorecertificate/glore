'use client'

import { useState } from 'react'

import {
  ArrowUpDownIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  FilterIcon,
  PencilIcon,
  ShieldIcon,
  ShieldUserIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  deleteTeamMember,
  getTeamMembers,
  inviteTeamMember,
  resendInvitation,
  updateTeamMemberRole,
} from '@/actions/admin/team'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type User } from '@/db/queries/user'

import {
  DeleteDialog,
  TeamInviteDialog,
  TeamMemberRow,
  type TeamRole,
  TeamStatCard,
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

    return filtered.toSorted((a, b) => {
      if (sortBy === 'name') return getDisplayName(a).localeCompare(getDisplayName(b))
      if (sortBy === 'role') return getUserRole(a).localeCompare(getUserRole(b))
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })()

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
      console.error(error)
      toast.error(t('inviteError'))
      return
    }

    toast.success(t('inviteSuccess', { email: data.email }))
    refreshTeam()
  }

  const handleChangeRole = async (user: User, role: TeamRole) => {
    const { error } = await updateTeamMemberRole(user.id, role)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(t('roleUpdateSuccess', { name: getDisplayName(user), role: t(`role_${role}`).toLowerCase() }))
    refreshTeam()
  }

  const handleResend = async (user: User) => {
    const { error, data } = await resendInvitation(user.id)

    if (error) {
      toast.error(t('resendError'))
      return
    }

    toast.success(t('resendSuccess', { email: data?.email ?? user.email }))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const { error } = await deleteTeamMember(deleteTarget.id)

    if (error) {
      toast.error(error)
      return
    }

    setDeletedIds(prev => new Set(prev).add(deleteTarget.id))
    setDeleteTarget(null)
    toast.success(t('deleteSuccess'))
  }

  const hasActiveFilters = filterRole !== 'all' || filterStatus !== 'all'

  return (
    <div className="space-y-6 pt-1">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TeamStatCard accent="brand" icon={UsersIcon} label={t('statMembers')} value={stats.total} />
        <TeamStatCard icon={ShieldUserIcon} label={t('statAdmins')} value={stats.admins} />
        <TeamStatCard icon={PencilIcon} label={t('statEditors')} value={stats.editors} />
        <TeamStatCard accent="amber" icon={ClockIcon} label={t('statPending')} value={stats.pending} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{t('members')}</h2>
            <Badge size="sm" variant="muted">
              {activeUsers.length}
            </Badge>
          </div>
          <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
            <UserPlusIcon className="mr-1.5 size-3.5" />
            {t('inviteMember')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-5 py-3">
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

        {displayUsers.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserIcon />
              </EmptyMedia>
              <EmptyTitle>{t('noMembers')}</EmptyTitle>
              {hasActiveFilters && <EmptyDescription>{t('tryAdjustingFilters')}</EmptyDescription>}
            </EmptyHeader>
            {hasActiveFilters && (
              <EmptyContent>
                <Button
                  onClick={() => {
                    setFilterRole('all')
                    setFilterStatus('all')
                  }}
                  size="sm"
                  variant="outline"
                >
                  {t('clearFilters')}
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="divide-y">
            <AnimatedList>
              {displayUsers.map(user => (
                <AnimatedListItem key={user.id} variant="row">
                  <TeamMemberRow
                    isCurrentUser={user.id === currentUser.id}
                    onChangeRole={handleChangeRole}
                    onDelete={setDeleteTarget}
                    onResend={handleResend}
                    user={user}
                  />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </div>
        )}

        {displayUsers.length > 0 && (
          <div className="border-t px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {t('memberCount', { count: displayUsers.length, total: activeUsers.length })}
            </p>
          </div>
        )}
      </div>

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
