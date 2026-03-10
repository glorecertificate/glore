'use client'

import { memo, useCallback, useMemo, useState } from 'react'

import {
  ArrowUpDownIcon,
  CalendarIcon,
  CheckIcon,
  FilterIcon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldIcon,
  ShieldUserIcon,
  Trash2Icon,
  UserIcon,
  UserPlusIcon,
} from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  deleteTeamMember,
  getTeamMembers,
  inviteTeamMember,
  resendInvitation,
  updateTeamMemberRole,
} from '@/actions/admin'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSelect } from '@/components/ui/language-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type User } from '@/db/queries/user'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

type TeamRole = 'admin' | 'editor'
type TeamStatus = 'joined' | 'pending'
type SortField = 'name' | 'role' | 'date'

const getUserRole = (user: User): TeamRole => (user.isAdmin ? 'admin' : 'editor')

const getUserStatus = (user: User): TeamStatus => (user.onboardedAt ? 'joined' : 'pending')

const getDisplayName = (user: User) => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.username) return `@${user.username}`
  return user.email
}

const TeamMemberRow = memo(
  ({
    isCurrentUser,
    onChangeRole,
    onDelete,
    onResend,
    user,
  }: {
    user: User
    isCurrentUser: boolean
    onChangeRole: (user: User, role: TeamRole) => void
    onDelete: (user: User) => void
    onResend: (user: User) => void
  }) => {
    const t = useTranslations('Admin.team')
    const role = getUserRole(user)
    const status = getUserStatus(user)
    const targetRole = role === 'admin' ? 'editor' : 'admin'

    return (
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
        <div className="flex items-center gap-4">
          <Avatar className="size-10 rounded-full">
            {user.avatarUrl && <AvatarImage alt={getDisplayName(user)} src={user.avatarUrl} />}
            <AvatarFallback className="rounded-full bg-muted font-medium text-sm">
              {user.initials || <UserIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-medium text-sm">
              {getDisplayName(user)}
              {isCurrentUser && (
                <Badge className="px-1.5" size="sm">
                  {t('you')}
                </Badge>
              )}
            </p>
            <p className="truncate text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="capitalize" variant="ghost">
            {role === 'admin' ? <ShieldUserIcon className="size-3" /> : <PencilIcon className="size-3" />}
            {t(`role_${role}`)}
          </Badge>
          <Badge
            className={cn(
              'capitalize',
              status === 'joined' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
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
              <DropdownMenuItem className="text-[13px]" onClick={() => onChangeRole(user, targetRole)}>
                {targetRole === 'admin' ? <ShieldUserIcon className="size-3" /> : <PencilIcon className="size-3" />}
                {t('makeRole', { role: t(`role_${targetRole}`) })}
              </DropdownMenuItem>
              {status === 'pending' && (
                <DropdownMenuItem className="text-[13px]" onClick={() => onResend(user)}>
                  <MailIcon className="size-3" />
                  {t('resendInvite')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-[13px]" onClick={() => onDelete(user)} variant="destructive">
                <Trash2Icon className="size-3" />
                {t('removeMember')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }
)

const InviteDialog = memo(
  ({
    defaultLocale,
    onInvite,
    onOpenChange,
    open,
  }: {
    defaultLocale: Locale
    onInvite: (data: {
      firstName: string
      lastName: string
      email: string
      role: TeamRole
      locale: Locale
    }) => Promise<void>
    open: boolean
    onOpenChange: (open: boolean) => void
  }) => {
    const t = useTranslations('Admin.team')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<TeamRole>('editor')
    const [locale, setLocale] = useState<Locale>(defaultLocale)
    const [submitting, setSubmitting] = useState(false)

    const resetForm = useCallback(() => {
      setFirstName('')
      setLastName('')
      setEmail('')
      setRole('editor')
      setLocale(defaultLocale)
    }, [defaultLocale])

    const handleSubmit = useCallback(async () => {
      if (!(firstName.trim() && email.trim())) {
        toast.error(t('errorInvalidInput'))
        return
      }

      try {
        setSubmitting(true)
        await onInvite({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), role, locale })
        resetForm()
        onOpenChange(false)
      } finally {
        setSubmitting(false)
      }
    }, [firstName, lastName, email, role, locale, onInvite, resetForm, onOpenChange, t])

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) resetForm()
        onOpenChange(open)
      },
      [onOpenChange, resetForm]
    )

    return (
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('inviteTitle')}</DialogTitle>
            <DialogDescription>{t('inviteDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="invite-first-name">{t('firstNameLabel')}</Label>
                <Input
                  disabled={submitting}
                  id="invite-first-name"
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={t('firstNamePlaceholder')}
                  value={firstName}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="invite-last-name">{t('lastNameLabel')}</Label>
                <Input
                  disabled={submitting}
                  id="invite-last-name"
                  onChange={e => setLastName(e.target.value)}
                  placeholder={t('lastNamePlaceholder')}
                  value={lastName}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="invite-email">{t('emailLabel')}</Label>
              <Input
                disabled={submitting}
                id="invite-email"
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                type="email"
                value={email}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="invite-role">{t('roleLabel')}</Label>
                <Select disabled={submitting} onValueChange={v => setRole(v as TeamRole)} value={role}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('role_admin')}</SelectItem>
                    <SelectItem value="editor">{t('role_editor')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <Label>{t('languageLabel')}</Label>
                <LanguageSelect controlled disabled={submitting} onChange={setLocale} value={locale} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={submitting} onClick={() => handleOpenChange(false)} variant="outline">
              {t('cancel')}
            </Button>
            <Button disabled={submitting} onClick={handleSubmit} variant="brand">
              {submitting ? t('sending') : t('sendInvite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

const DeleteDialog = memo(
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
    const t = useTranslations('Admin.team')
    const [deleting, setDeleting] = useState(false)

    const handleConfirm = useCallback(async () => {
      try {
        setDeleting(true)
        await onConfirm()
      } finally {
        setDeleting(false)
      }
    }, [onConfirm])

    return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: user ? getDisplayName(user) : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              loading={deleting}
              loadingText={t('deleting')}
              onClick={handleConfirm}
              variant="destructive"
            >
              {t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)

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
            <p className="font-medium text-muted-foreground text-sm">{t('noMembers')}</p>
            {hasActiveFilters && <p className="mt-1 text-muted-foreground/70 text-xs">{t('tryAdjustingFilters')}</p>}
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

      <p className="text-muted-foreground text-xs">
        {t('memberCount', { count: displayUsers.length, total: activeUsers.length })}
      </p>

      <InviteDialog defaultLocale={locale} onInvite={handleInvite} onOpenChange={setInviteOpen} open={inviteOpen} />

      <DeleteDialog
        onConfirm={handleDelete}
        onOpenChange={open => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
        user={deleteTarget}
      />
    </div>
  )
}
