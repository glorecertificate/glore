'use client'

import { useCallback, useMemo, useState } from 'react'

import { FilterIcon, SearchIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { banUser, getAdminUsers, unbanUser, updateUserRole } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type User } from '@/db/queries/user'
import { useSession } from '@/hooks/use-session'

import {
  BanDialog,
  type PlatformRole,
  UnbanDialog,
  UserRow,
  type UserStatus,
  getDisplayName,
  getUserPlatformRole,
  getUserStatus,
} from './users-items'

export const AdminUsers = ({ users: initialUsers }: { users: User[] }) => {
  const t = useTranslations('Admin.users')
  const { user: currentUser } = useSession()

  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<PlatformRole | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all')
  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [unbanTarget, setUnbanTarget] = useState<User | null>(null)

  const displayUsers = useMemo(() => {
    let filtered = users

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        u =>
          getDisplayName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.username?.toLowerCase().includes(q) ?? false)
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => getUserPlatformRole(u) === filterRole)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => getUserStatus(u) === filterStatus)
    }

    return filtered
  }, [users, search, filterRole, filterStatus])

  const refreshUsers = useCallback(async () => {
    const { data } = await getAdminUsers({ cache: false })
    if (data) setUsers(data)
  }, [])

  const handleChangeRole = useCallback(
    async (user: User, role: PlatformRole) => {
      const { error } = await updateUserRole(user.id, role)
      if (error) {
        console.error(error)
        toast.error(t('roleUpdateError'))
        return
      }
      toast.success(t('roleUpdateSuccess', { name: getDisplayName(user), role: t(`role_${role}`) }))
      refreshUsers()
    },
    [t, refreshUsers]
  )

  const handleBanConfirm = useCallback(
    async (reason?: string) => {
      if (!banTarget) return
      const { error } = await banUser(banTarget.id, reason)
      if (error) {
        console.error(error)
        toast.error(t('banError'))
        return
      }
      toast.success(t('banSuccess', { name: getDisplayName(banTarget) }))
      setBanTarget(null)
      refreshUsers()
    },
    [banTarget, t, refreshUsers]
  )

  const handleUnbanConfirm = useCallback(async () => {
    if (!unbanTarget) return
    const { error } = await unbanUser(unbanTarget.id)
    if (error) {
      console.error(error)
      toast.error(t('unbanError'))
      return
    }
    toast.success(t('unbanSuccess', { name: getDisplayName(unbanTarget) }))
    setUnbanTarget(null)
    refreshUsers()
  }, [unbanTarget, t, refreshUsers])

  const hasFilters = search.trim() !== '' || filterRole !== 'all' || filterStatus !== 'all'

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setFilterRole('all')
    setFilterStatus('all')
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            value={search}
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon className="size-4 text-muted-foreground" />
          <Select onValueChange={v => setFilterRole(v as PlatformRole | 'all')} value={filterRole}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter_allRoles')}</SelectItem>
              <SelectItem value="admin">{t('role_admin')}</SelectItem>
              <SelectItem value="editor">{t('role_editor')}</SelectItem>
              <SelectItem value="user">{t('role_user')}</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={v => setFilterStatus(v as UserStatus | 'all')} value={filterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter_allStatuses')}</SelectItem>
              <SelectItem value="active">{t('status_active')}</SelectItem>
              <SelectItem value="banned">{t('status_banned')}</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button onClick={handleClearFilters} size="sm" variant="ghost">
              {t('clearFilters')}
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('memberCount', { count: displayUsers.length, total: users.length })}
      </p>
      {displayUsers.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {hasFilters ? t('tryAdjustingFilters') : t('noUsers')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayUsers.map(u => (
            <UserRow
              isCurrentUser={u.id === currentUser.id}
              key={u.id}
              onBan={setBanTarget}
              onChangeRole={handleChangeRole}
              onUnban={setUnbanTarget}
              user={u}
            />
          ))}
        </div>
      )}
      <BanDialog
        onConfirm={handleBanConfirm}
        onOpenChange={open => !open && setBanTarget(null)}
        open={banTarget !== null}
        user={banTarget}
      />
      <UnbanDialog
        onConfirm={handleUnbanConfirm}
        onOpenChange={open => !open && setUnbanTarget(null)}
        open={unbanTarget !== null}
        user={unbanTarget}
      />
    </div>
  )
}
