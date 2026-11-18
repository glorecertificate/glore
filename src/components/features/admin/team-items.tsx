'use client'

import { useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSelect } from '@/components/ui/language-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { type TeamMember } from '@/db/queries/admin-user'
import { type User } from '@/db/queries/user'

import { ActionDialog } from './action-dialog'
import { rememberMenuTrigger } from './menu-focus'

export type TeamRole = 'admin' | 'editor'
export type TeamStatus = 'joined' | 'pending'

export const ROLE_ICONS = {
  admin: 'shield-user',
  editor: 'pencil',
} as const satisfies Record<TeamRole, IconName>

export const getUserRole = (user: User): TeamRole => (user.isAdmin ? 'admin' : 'editor')

export const getUserStatus = (user: User): TeamStatus => (user.onboardedAt ? 'joined' : 'pending')

export const getDisplayName = (user: User) => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.username) return `@${user.username}`
  return user.email
}

export const TeamMemberActions = ({
  busy,
  onChangeRole,
  onDelete,
  onResend,
  user,
}: {
  busy: boolean
  onChangeRole: (user: User, role: TeamRole) => void
  onDelete: (user: User) => void
  onResend: (user: User) => void
  user: TeamMember
}) => {
  const t = useTranslations('Admin.team')
  const role = getUserRole(user)
  const targetRole = role === 'admin' ? 'editor' : 'admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`${t('actions')}: ${getDisplayName(user)}`} disabled={busy} size="icon" variant="ghost">
          <LucideIcon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onChangeRole(user, targetRole)}>
          <LucideIcon name={ROLE_ICONS[targetRole]} />
          {t('makeRole', { role: t(`role_${targetRole}`) })}
        </DropdownMenuItem>
        {getUserStatus(user) === 'pending' && user.invitationOpen && (
          <DropdownMenuItem onSelect={() => onResend(user)}>
            <LucideIcon name="mail" />
            {t('resendInvite')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            rememberMenuTrigger()
            onDelete(user)
          }}
          variant="destructive"
        >
          <LucideIcon name="trash-2" />
          {t('removeMember')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  }) => Promise<boolean>
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
      const sent = await onInvite({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
        locale,
      })
      if (!sent) return
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

  const handleConfirm = async () => {
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ActionDialog
      busy={deleting}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirmDelete')}
      description={t('deleteDescription', { name: user ? getDisplayName(user) : '' })}
      loadingLabel={t('removing')}
      onConfirm={handleConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t('deleteTitle')}
      tone="destructive"
    />
  )
}
