'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSelect } from '@/components/ui/language-select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { type OrganizationMembershipRole } from '@/db/queries/organization'
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
  onCloseAutoFocus?: (event: Event) => void
  onOpenChange: (open: boolean) => void
  onSent: () => void
  open: boolean
}

export const InviteMemberDialog = ({
  allowedRoles,
  defaultLocale,
  onInvite,
  onCloseAutoFocus,
  onOpenChange,
  onSent,
  open,
}: InviteMemberDialogProps) => {
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()

  const [mode, setMode] = useState<InviteMode>('single')
  const [role, setRole] = useState<OrganizationMembershipRole>(allowedRoles[0] ?? 'learner')
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<InvitationRowResult[] | null>(null)

  const max = config.maxBulkInvites

  const schema = z.object({
    text: z.string().superRefine((value, ctx) => {
      const list = parseEmails(value)
      const invalid = list.find(email => !z.email().safeParse(email).success)
      if (list.length === 0) return ctx.addIssue({ code: 'custom', message: t('emailRequired') })
      if (list.length > max) return ctx.addIssue({ code: 'custom', message: t('bulkTooMany', { max }) })
      if (!invalid) return
      ctx.addIssue({
        code: 'custom',
        message: mode === 'single' ? t('emailInvalid') : t('bulkInvalid', { email: invalid }),
      })
    }),
  })

  const form = useForm<z.infer<typeof schema>>({ defaultValues: { text: '' }, resolver: zodResolver(schema) })
  const text = form.watch('text')
  const emails = parseEmails(text)
  const roleValue = allowedRoles.includes(role) ? role : (allowedRoles[0] ?? 'learner')

  const reset = () => {
    setMode('single')
    form.reset({ text: '' })
    setMessage('')
    setResults(null)
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (submitting) return
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async () => {
    if (submitting) return

    setSubmitting(true)
    try {
      const { data, error } = await onInvite({ emails, locale, message: message.trim() || undefined, role: roleValue })

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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus} className="sm:max-w-lg">
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
          <Form {...form}>
            <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
              <SegmentedControl
                aria-label={t('modeLabel')}
                disabled={submitting}
                onValueChange={value => {
                  setMode(value as InviteMode)
                  form.clearErrors()
                }}
                value={mode}
              >
                <SegmentedControlItem value="single">{t('modeSingle')}</SegmentedControlItem>
                <SegmentedControlItem value="bulk">{t('modeBulk')}</SegmentedControlItem>
              </SegmentedControl>

              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>{mode === 'single' ? t('emailLabel') : t('bulkLabel')}</FormLabel>
                    <FormControl>
                      {mode === 'single' ? (
                        <Input
                          {...field}
                          autoComplete="off"
                          autoFocus
                          disabled={submitting}
                          placeholder={tOrganization('emailPlaceholder')}
                          type="email"
                        />
                      ) : (
                        <Textarea
                          {...field}
                          autoFocus
                          className="min-h-32 font-mono text-sm"
                          disabled={submitting}
                          placeholder={t('bulkPlaceholder')}
                        />
                      )}
                    </FormControl>
                    {mode === 'bulk' && !form.formState.errors.text && (
                      <p className="text-xs text-muted-foreground">{t('bulkHint', { count: emails.length, max })}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <Button loading={submitting} type="submit" variant="brand">
                  {t('send', { count: emails.length })}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
