'use client'

import { useCallback, useEffect, useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSelect } from '@/components/ui/language-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type OrganizationMembershipRole } from '@/db/queries/organization'

interface InviteMemberDialogProps {
  allowedRoles: OrganizationMembershipRole[]
  defaultLocale: Locale
  onInvite: (values: {
    email: string
    firstName: string
    lastName: string
    locale: string
    role: OrganizationMembershipRole
  }) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const InviteMemberDialog = ({
  allowedRoles,
  defaultLocale,
  onInvite,
  onOpenChange,
  open,
}: InviteMemberDialogProps) => {
  const t = useTranslations('Organization')

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [role, setRole] = useState<OrganizationMembershipRole>(allowedRoles[0] ?? 'learner')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setRole(allowedRoles[0] ?? 'learner')
  }, [allowedRoles])

  const reset = useCallback(() => {
    setEmail('')
    setFirstName('')
    setLastName('')
    setLocale(defaultLocale)
    setRole(allowedRoles[0] ?? 'learner')
  }, [allowedRoles, defaultLocale])

  const handleSubmit = useCallback(async () => {
    if (!(email.trim() && firstName.trim())) {
      toast.error(t('inviteInvalid'))
      return
    }

    try {
      setSubmitting(true)
      await onInvite({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        locale,
        role,
      })
      reset()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }, [email, firstName, lastName, locale, onInvite, onOpenChange, reset, role, t])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteTitle')}</DialogTitle>
          <DialogDescription>{t('inviteDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="organization-invite-first-name">{t('firstName')}</Label>
              <Input
                disabled={submitting}
                id="organization-invite-first-name"
                onChange={e => setFirstName(e.target.value)}
                placeholder={t('firstNamePlaceholder')}
                value={firstName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="organization-invite-last-name">{t('lastName')}</Label>
              <Input
                disabled={submitting}
                id="organization-invite-last-name"
                onChange={e => setLastName(e.target.value)}
                placeholder={t('lastNamePlaceholder')}
                value={lastName}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-invite-email">{t('email')}</Label>
            <Input
              disabled={submitting}
              id="organization-invite-email"
              onChange={e => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              type="email"
              value={email}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="organization-invite-role">{t('role')}</Label>
              <Select
                disabled={submitting}
                onValueChange={value => setRole(value as OrganizationMembershipRole)}
                value={role}
              >
                <SelectTrigger id="organization-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map(item => (
                    <SelectItem key={item} value={item}>
                      {t(`role_${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('language')}</Label>
              <LanguageSelect controlled disabled={submitting} onChange={setLocale} value={locale} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={submitting} onClick={() => onOpenChange(false)} variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={submitting}
            loading={submitting}
            loadingText={t('sending')}
            onClick={handleSubmit}
            variant="brand"
          >
            {t('sendInvite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
