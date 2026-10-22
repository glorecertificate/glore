'use client'

import { useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { type InvitationRowResult, type InviteInput } from '@/actions/organizations/invite-core'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type OrganizationMembershipRole } from '@/db/queries/organization'
import { cn } from '@/lib/utils'
import config from '~/config/app.json'

import { InviteResults } from './invite-results'
import { parseEmails } from './utils'

type InviteMode = 'bulk' | 'single'

interface InviteMemberDialogProps {
  allowedRoles: OrganizationMembershipRole[]
  defaultLocale: Locale
  onInvite: (
    input: InviteInput
  ) => Promise<{ data: InvitationRowResult[] | null; error: { code?: string | null; message: string } | null }>
  onOpenChange: (open: boolean) => void
  onSent: () => void
  open: boolean
}

export const InviteMemberDialog = ({
  allowedRoles,
  defaultLocale,
  onInvite,
  onOpenChange,
  onSent,
  open,
}: InviteMemberDialogProps) => {
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()

  const [mode, setMode] = useState<InviteMode>('single')
  const [text, setText] = useState('')
  const [role, setRole] = useState<OrganizationMembershipRole>(allowedRoles[0] ?? 'learner')
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<InvitationRowResult[] | null>(null)

  const emails = parseEmails(text)
  const max = config.maxBulkInvites
  const tooMany = emails.length > max
  const roleValue = allowedRoles.includes(role) ? role : (allowedRoles[0] ?? 'learner')

  const reset = () => {
    setMode('single')
    setText('')
    setMessage('')
    setResults(null)
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (submitting) return
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting || emails.length === 0 || tooMany) return

    setSubmitting(true)
    const { data, error } = await onInvite({ emails, locale, message: message.trim() || undefined, role: roleValue })
    setSubmitting(false)

    if (error || !data) {
      toast.error(errorMessage(error?.code))
      return
    }

    if (data.some(({ status }) => status === 'sent')) onSent()

    const [first] = data
    if (mode === 'single' && data.length === 1 && first?.status === 'sent') {
      toast.success(t('sentOne', { email: first.email }))
      handleOpenChange(false)
      return
    }

    setResults(data)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inviteTitle')}</DialogTitle>
          <DialogDescription>{t('inviteDescription')}</DialogDescription>
        </DialogHeader>

        {results ? (
          <>
            <InviteResults results={results} />
            <DialogFooter>
              <Button onClick={reset} variant="outline">
                {t('inviteMore')}
              </Button>
              <Button onClick={() => handleOpenChange(false)} variant="brand">
                {t('done')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <SegmentedControl
              aria-label={t('modeLabel')}
              disabled={submitting}
              onValueChange={value => setMode(value as InviteMode)}
              value={mode}
            >
              <SegmentedControlItem value="single">{t('modeSingle')}</SegmentedControlItem>
              <SegmentedControlItem value="bulk">{t('modeBulk')}</SegmentedControlItem>
            </SegmentedControl>

            {mode === 'single' ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-invite-email">{t('emailLabel')}</Label>
                <Input
                  autoComplete="off"
                  autoFocus
                  disabled={submitting}
                  id="organization-invite-email"
                  onChange={event => setText(event.target.value)}
                  placeholder={tOrganization('emailPlaceholder')}
                  type="email"
                  value={text}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-invite-emails">{t('bulkLabel')}</Label>
                <Textarea
                  aria-describedby="organization-invite-emails-hint"
                  autoFocus
                  className="min-h-32 font-mono text-sm"
                  disabled={submitting}
                  id="organization-invite-emails"
                  onChange={event => setText(event.target.value)}
                  placeholder={t('bulkPlaceholder')}
                  value={text}
                />
                <p
                  className={cn('text-xs text-muted-foreground', tooMany && 'text-destructive-text')}
                  id="organization-invite-emails-hint"
                >
                  {tooMany ? t('bulkTooMany', { max }) : t('bulkHint', { count: emails.length, max })}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-invite-role">{t('roleLabel')}</Label>
                <Select
                  disabled={submitting}
                  onValueChange={value => setRole(value as OrganizationMembershipRole)}
                  value={roleValue}
                >
                  <SelectTrigger id="organization-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map(item => (
                      <SelectItem key={item} value={item}>
                        {tOrganization(`role_${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t('languageLabel')}</Label>
                <LanguageSelect controlled disabled={submitting} onChange={setLocale} value={locale} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="organization-invite-message">
                {t('messageLabel')} <span className="text-muted-foreground">{t('optional')}</span>
              </Label>
              <Textarea
                disabled={submitting}
                id="organization-invite-message"
                maxLength={500}
                onChange={event => setMessage(event.target.value)}
                placeholder={t('messagePlaceholder')}
                value={message}
              />
            </div>

            <DialogFooter>
              <Button disabled={submitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
                {t('cancel')}
              </Button>
              <Button disabled={emails.length === 0 || tooMany} loading={submitting} type="submit" variant="brand">
                {t('send', { count: emails.length })}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
