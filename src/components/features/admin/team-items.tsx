'use client'

import { useState } from 'react'

import { MailIcon, MoreHorizontalIcon, PencilIcon, ShieldUserIcon, Trash2Icon, UserIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

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
import { Card } from '@/components/ui/card'
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
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

export type TeamRole = 'admin' | 'editor'
export type TeamStatus = 'joined' | 'pending'

const STAT_ACCENTS = {
  brand: 'border-brand/20 bg-brand/10 text-brand',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-500',
  success: 'border-success/25 bg-success/10 text-success',
} as const

export const TeamStatCard = ({
  accent,
  icon: StatIcon,
  label,
  value,
}: {
  accent?: keyof typeof STAT_ACCENTS
  icon: Icon
  label: string
  value: number
}) => (
  <Card className="flex-row items-center justify-start gap-3.5 p-4">
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg border',
        accent && STAT_ACCENTS[accent]
      )}
    >
      <StatIcon className="size-5" />
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-2xl leading-none font-semibold tabular-nums">{value}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  </Card>
)

export const getUserRole = (user: User): TeamRole => (user.isAdmin ? 'admin' : 'editor')

export const getUserStatus = (user: User): TeamStatus => (user.onboardedAt ? 'joined' : 'pending')

export const getDisplayName = (user: User) => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.username) return `@${user.username}`
  return user.email
}

export const TeamMemberRow = ({
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
    <div className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="relative shrink-0">
          <Avatar className="size-10 rounded-full ring-2 ring-background">
            {user.avatarUrl && <AvatarImage alt={getDisplayName(user)} src={user.avatarUrl} />}
            <AvatarFallback className="rounded-full bg-muted text-sm font-medium">
              {user.initials || <UserIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {getDisplayName(user)}
            {isCurrentUser && (
              <Badge className="px-1.5" size="sm" variant="muted">
                {t('you')}
              </Badge>
            )}
            {status === 'pending' && (
              <Badge
                className="bg-amber-500/10 px-1.5 text-amber-600 capitalize dark:text-amber-500"
                size="sm"
                variant="ghost"
              >
                {t('status_pending')}
              </Badge>
            )}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-2.5">
        <Badge className={cn('gap-1 border capitalize')} variant="ghost">
          {role === 'admin' ? <ShieldUserIcon className="size-3" /> : <PencilIcon className="size-3" />}
          {t(`role_${role}`)}
        </Badge>
        {!isCurrentUser && (
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
        )}
      </div>
    </div>
  )
}

export const TeamInviteDialog = ({
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

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setRole('editor')
    setLocale(defaultLocale)
  }

  const handleSubmit = async () => {
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
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteTitle')}</DialogTitle>
          <DialogDescription>{t('inviteDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="invite-first-name">{t('firstNameLabel')}</Label>
              <Input
                disabled={submitting}
                id="invite-first-name"
                onChange={e => setFirstName(e.target.value)}
                placeholder={t('firstNamePlaceholder')}
                value={firstName}
              />
            </div>
            <div className="flex flex-col gap-y-2">
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
          <div className="flex flex-col gap-y-2">
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
            <div className="flex flex-col gap-y-2">
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
            <div className="flex flex-col gap-y-2">
              <Label>{t('languageLabel')}</Label>
              <LanguageSelect controlled disabled={submitting} onChange={setLocale} value={locale} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={submitting} onClick={() => handleOpenChange(false)} variant="outline">
            {t('cancel')}
          </Button>
          <Button disabled={submitting} loading={submitting} onClick={handleSubmit} variant="brand">
            {t('sendInvite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const DeleteDialog = ({
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

  const handleConfirm = async (event: React.MouseEvent) => {
    event.preventDefault()
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent onEscapeKeyDown={event => deleting && event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteDescription', { name: user ? getDisplayName(user) : '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction loading={deleting} onClick={handleConfirm} variant="destructive">
            {t('confirmDelete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
