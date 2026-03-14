'use client'

import { memo, useCallback, useMemo, useState } from 'react'

import {
  BanIcon,
  CheckCheckIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  ShieldUserIcon,
  UserIcon,
  UserRoundCheckIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { banUser, getAdminUsers, unbanUser, updateUserRole } from '@/actions/admin'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type User } from '@/db/queries/user'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

type PlatformRole = 'admin' | 'editor' | 'user'
type UserStatus = 'active' | 'banned'

const getUserPlatformRole = (user: User): PlatformRole => {
  if (user.isAdmin) return 'admin'
  if (user.isEditor) return 'editor'
  return 'user'
}

const getUserStatus = (user: User): UserStatus => (user.banned ? 'banned' : 'active')

const getDisplayName = (user: User) => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.username) return `@${user.username}`
  return user.email
}

const UserRow = memo(
  ({
    isCurrentUser,
    onBan,
    onChangeRole,
    onUnban,
    user,
  }: {
    user: User
    isCurrentUser: boolean
    onBan: (user: User) => void
    onUnban: (user: User) => void
    onChangeRole: (user: User, role: PlatformRole) => void
  }) => {
    const t = useTranslations('Admin.users')
    const role = getUserPlatformRole(user)
    const status = getUserStatus(user)

    return (
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
        <div className="flex items-center gap-4">
          <Avatar className="size-10 rounded-full">
            {user.avatarUrl && <AvatarImage alt={getDisplayName(user)} src={user.avatarUrl} />}
            <AvatarFallback className="rounded-full bg-muted text-sm font-medium">
              {user.initials || <UserIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {getDisplayName(user)}
              {isCurrentUser && (
                <Badge className="px-1.5" size="sm">
                  {t('you')}
                </Badge>
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.organizations.length > 0 && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {t('orgCount', { count: user.organizations.length })}
            </p>
          )}
          <Badge className="capitalize" variant="ghost">
            {role === 'admin' && <ShieldUserIcon className="size-3" />}
            {role === 'editor' && <PencilIcon className="size-3" />}
            {role === 'user' && <UserIcon className="size-3" />}
            {t(`role_${role}`)}
          </Badge>
          <Badge
            className={cn(
              'capitalize',
              status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
            )}
            variant="ghost"
          >
            {t(`status_${status}`)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t('actions')}
                className={cn(isCurrentUser && 'pointer-events-none opacity-0')}
                size="icon"
                variant="ghost"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
              {role !== 'admin' && (
                <DropdownMenuItem className="text-[13px]" onClick={() => onChangeRole(user, 'admin')}>
                  <ShieldUserIcon className="size-3" />
                  {t('makeRole', { role: t('role_admin') })}
                </DropdownMenuItem>
              )}
              {role !== 'editor' && (
                <DropdownMenuItem className="text-[13px]" onClick={() => onChangeRole(user, 'editor')}>
                  <PencilIcon className="size-3" />
                  {t('makeRole', { role: t('role_editor') })}
                </DropdownMenuItem>
              )}
              {role !== 'user' && (
                <DropdownMenuItem className="text-[13px]" onClick={() => onChangeRole(user, 'user')}>
                  <UserIcon className="size-3" />
                  {t('makeRole', { role: t('role_user') })}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {status === 'active' ? (
                <DropdownMenuItem className="text-[13px]" onClick={() => onBan(user)} variant="destructive">
                  <BanIcon className="size-3" />
                  {t('ban')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-[13px]" onClick={() => onUnban(user)}>
                  <UserRoundCheckIcon className="size-3" />
                  {t('unban')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }
)

const BanDialog = memo(
  ({
    onConfirm,
    onOpenChange,
    open,
    user,
  }: {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason?: string) => Promise<void>
  }) => {
    const t = useTranslations('Admin.users')
    const [reason, setReason] = useState('')
    const [banning, setBanning] = useState(false)

    const handleConfirm = useCallback(async () => {
      try {
        setBanning(true)
        await onConfirm(reason.trim() || undefined)
        setReason('')
      } finally {
        setBanning(false)
      }
    }, [onConfirm, reason])

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) setReason('')
        onOpenChange(open)
      },
      [onOpenChange]
    )

    return (
      <AlertDialog onOpenChange={handleOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('banTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('banDescription', { name: user ? getDisplayName(user) : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-2 px-1">
            <Label htmlFor="ban-reason">{t('banReason')}</Label>
            <Textarea
              disabled={banning}
              id="ban-reason"
              onChange={e => setReason(e.target.value)}
              placeholder={t('banReasonPlaceholder')}
              rows={2}
              value={reason}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={banning}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              loading={banning}
              loadingText={t('banning')}
              onClick={handleConfirm}
              variant="destructive"
            >
              {t('confirmBan')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)

const UnbanDialog = memo(
  ({
    onConfirm,
    onOpenChange,
    open,
    user,
  }: {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
  }) => {
    const t = useTranslations('Admin.users')
    const [unbanning, setUnbanning] = useState(false)

    const handleConfirm = useCallback(async () => {
      try {
        setUnbanning(true)
        await onConfirm()
      } finally {
        setUnbanning(false)
      }
    }, [onConfirm])

    return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unbanTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('unbanDescription', { name: user ? getDisplayName(user) : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unbanning}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction loading={unbanning} loadingText={t('unbanning')} onClick={handleConfirm}>
              <CheckCheckIcon className="size-4" />
              {t('confirmUnban')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)

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
