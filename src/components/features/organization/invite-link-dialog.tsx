'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { createOrganizationInviteLink } from '@/actions/organizations/invitations'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const EXPIRY_OPTIONS = ['1', '7', '30', '90', 'never'] as const
const LINK_ROLES = ['learner', 'volunteer'] as const

type LinkRole = (typeof LINK_ROLES)[number]

interface InviteLinkDialogProps {
  onCreated: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const InviteLinkDialog = ({ onCreated, onOpenChange, open }: InviteLinkDialogProps) => {
  const t = useTranslations('Invitations')
  const tOrganization = useTranslations('Organization')
  const errorMessage = useInvitationError()

  const [role, setRole] = useState<LinkRole>('volunteer')
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [expiry, setExpiry] = useState<(typeof EXPIRY_OPTIONS)[number]>('30')
  const [maxUses, setMaxUses] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  const parsedMaxUses = maxUses.trim() ? Number(maxUses) : null
  const maxUsesInvalid = parsedMaxUses !== null && !(Number.isInteger(parsedMaxUses) && parsedMaxUses >= 1)

  const reset = () => {
    setRole('volunteer')
    setRequiresApproval(true)
    setExpiry('30')
    setMaxUses('')
    setUrl(null)
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (submitting) return
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting || maxUsesInvalid) return

    setSubmitting(true)
    const { data, error } = await createOrganizationInviteLink({
      expiryDays: expiry === 'never' ? null : Number(expiry),
      maxUses: parsedMaxUses,
      requiresApproval,
      role,
    })
    setSubmitting(false)

    if (error || !data) {
      toast.error(errorMessage(error?.code))
      return
    }

    setUrl(data.url)
    onCreated()
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('linkDialogTitle')}</DialogTitle>
          <DialogDescription>{t('linkDialogDescription')}</DialogDescription>
        </DialogHeader>

        {url ? (
          <>
            <div className="grid gap-3 py-2">
              <output className="block text-sm font-medium">{t('linkCreated')}</output>
              <Input aria-label={t('linkUrlLabel')} onFocus={event => event.target.select()} readOnly value={url} />
              <CopyButton className="w-fit" label={t('copyLink')} value={url} />
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} variant="brand">
                {t('done')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="organization-link-role">{t('roleLabel')}</Label>
              <Select disabled={submitting} onValueChange={value => setRole(value as LinkRole)} value={role}>
                <SelectTrigger id="organization-link-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_ROLES.map(item => (
                    <SelectItem key={item} value={item}>
                      {tOrganization(`role_${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <Label htmlFor="organization-link-approval">{t('approvalLabel')}</Label>
                <p className="text-xs text-muted-foreground">{t('approvalHint')}</p>
              </div>
              <Switch
                checked={requiresApproval}
                disabled={submitting}
                id="organization-link-approval"
                onCheckedChange={setRequiresApproval}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-link-expiry">{t('expiryLabel')}</Label>
                <Select
                  disabled={submitting}
                  onValueChange={value => setExpiry(value as (typeof EXPIRY_OPTIONS)[number])}
                  value={expiry}
                >
                  <SelectTrigger id="organization-link-expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map(item => (
                      <SelectItem key={item} value={item}>
                        {item === 'never' ? t('expiryNever') : t('expiryDays', { count: Number(item) })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-link-uses">{t('maxUsesLabel')}</Label>
                <Input
                  aria-invalid={maxUsesInvalid}
                  disabled={submitting}
                  id="organization-link-uses"
                  inputMode="numeric"
                  min={1}
                  onChange={event => setMaxUses(event.target.value)}
                  placeholder={t('maxUsesPlaceholder')}
                  type="number"
                  value={maxUses}
                />
              </div>
            </div>

            <DialogFooter>
              <Button disabled={submitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
                {t('cancel')}
              </Button>
              <Button disabled={maxUsesInvalid} loading={submitting} type="submit" variant="brand">
                {t('createLink')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
