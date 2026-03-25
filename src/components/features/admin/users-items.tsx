'use client'

import { memo, useCallback, useState } from 'react'

import {
  BanIcon,
  CheckCheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldUserIcon,
  UserIcon,
  UserRoundCheckIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type User } from '@/db/queries/user'
import { cn } from '@/lib/utils'

export type PlatformRole = 'admin' | 'editor' | 'user'
export type UserStatus = 'active' | 'banned'

export const getUserPlatformRole = (user: User): PlatformRole => {
  if (user.isAdmin) return 'admin'
  if (user.isEditor) return 'editor'
  return 'user'
}

export const getUserStatus = (user: User): UserStatus => (user.banned ? 'banned' : 'active')

export const getDisplayName = (user: User) => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.username) return `@${user.username}`
  return user.email
}

export const UserRow = memo(
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

export const BanDialog = memo(
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

export const UnbanDialog = memo(
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
