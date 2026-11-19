'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { CountrySelect } from '@/components/ui/country-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { type AdminOrganization } from '@/db/queries/organization'

import { ActionDialog } from './action-dialog'

const ReviewDialog = ({
  description,
  onCloseAutoFocus,
  mode,
  onConfirm,
  onOpenChange,
  open,
  org,
  requireComment = false,
  title,
}: {
  description?: React.ReactNode
  onCloseAutoFocus?: (event: Event) => void
  mode: 'approve' | 'reject'
  onConfirm: (comment?: string) => Promise<boolean>
  onOpenChange: (open: boolean) => void
  open: boolean
  org: Pick<AdminOrganization, 'name'> | null
  requireComment?: boolean
  title?: React.ReactNode
}) => {
  const t = useTranslations('Admin.organizations')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const approving = mode === 'approve'
  const id = `${mode}-comment`

  const handleConfirm = async () => {
    try {
      setLoading(true)
      const succeeded = await onConfirm(comment.trim() || undefined)
      if (succeeded) setComment('')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setComment('')
    onOpenChange(isOpen)
  }

  return (
    <ActionDialog
      onCloseAutoFocus={onCloseAutoFocus}
      busy={loading}
      cancelLabel={t('cancel')}
      confirmDisabled={requireComment && comment.trim() === ''}
      confirmLabel={approving ? t('approve') : t('reject')}
      description={description ?? t(approving ? 'approveDescription' : 'rejectDescription', { name: org?.name ?? '' })}
      loadingLabel={approving ? t('approving') : t('rejecting')}
      onConfirm={handleConfirm}
      onOpenChange={handleOpenChange}
      open={open}
      title={title ?? t(approving ? 'approveTitle' : 'rejectTitle')}
      tone={approving ? 'default' : 'destructive'}
    >
      <div className="flex flex-col gap-y-2">
        <Label htmlFor={id}>{t(requireComment ? 'commentLabelRequired' : 'commentLabelOptional')}</Label>
        <Textarea
          disabled={loading}
          id={id}
          onChange={e => setComment(e.target.value)}
          placeholder={approving ? t('commentPlaceholder') : t('rejectCommentPlaceholder')}
          rows={3}
          value={comment}
        />
      </div>
    </ActionDialog>
  )
}

export const ApproveDialog = (props: Omit<React.ComponentProps<typeof ReviewDialog>, 'mode'>) => (
  <ReviewDialog mode="approve" {...props} />
)

export const RejectDialog = (props: Omit<React.ComponentProps<typeof ReviewDialog>, 'mode'>) => (
  <ReviewDialog mode="reject" {...props} />
)

export const OrgInviteDialog = ({
  onCloseAutoFocus,
  onInvite,
  onOpenChange,
  open,
}: {
  onCloseAutoFocus?: (event: Event) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (data: {
    name: string
    email: string
    city: string
    country: string
    url?: string
    registrantEmail: string
  }) => Promise<void>
}) => {
  const t = useTranslations('Admin.organizations')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [url, setUrl] = useState('')
  const [registrantEmail, setRegistrantEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCountryChange = (value: string | React.ChangeEvent<HTMLButtonElement>) =>
    typeof value === 'string' && setCountry(value)

  const resetForm = () => {
    setName('')
    setEmail('')
    setCity('')
    setCountry('')
    setUrl('')
    setRegistrantEmail('')
  }

  const handleSubmit = async () => {
    if (!(name.trim() && email.trim() && city.trim() && country && registrantEmail.trim())) {
      toast.error(t('inviteErrorMissingFields'))
      return
    }

    try {
      setLoading(true)
      await onInvite({
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
        country,
        url: url.trim() || undefined,
        registrantEmail: registrantEmail.trim(),
      })
      resetForm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  return (
    <ActionDialog
      onCloseAutoFocus={onCloseAutoFocus}
      busy={loading}
      cancelLabel={t('cancel')}
      confirmLabel={t('inviteSubmit')}
      description={t('inviteDescription')}
      loadingLabel={t('inviting')}
      onConfirm={handleSubmit}
      onOpenChange={handleOpenChange}
      open={open}
      title={t('inviteTitle')}
    >
      <div className="grid gap-3 py-2">
        <p className="text-sm font-medium text-muted-foreground">{t('inviteOrgSection')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-y-2">
            <Label htmlFor="invite-name">{t('inviteOrgName')}</Label>
            <Input
              autoFocus
              disabled={loading}
              id="invite-name"
              onChange={e => setName(e.target.value)}
              placeholder={t('inviteOrgNamePlaceholder')}
              value={name}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="invite-org-email">{t('inviteOrgEmail')}</Label>
            <Input
              disabled={loading}
              id="invite-org-email"
              onChange={e => setEmail(e.target.value)}
              placeholder={t('inviteOrgEmailPlaceholder')}
              type="email"
              value={email}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="invite-url">{t('inviteOrgUrl')}</Label>
            <Input
              disabled={loading}
              id="invite-url"
              onChange={e => setUrl(e.target.value)}
              placeholder={t('inviteOrgUrlPlaceholder')}
              type="url"
              value={url}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="invite-city">{t('inviteCity')}</Label>
            <Input
              disabled={loading}
              id="invite-city"
              onChange={e => setCity(e.target.value)}
              placeholder={t('inviteCityPlaceholder')}
              value={city}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>{t('inviteCountry')}</Label>
            <CountrySelect onChange={handleCountryChange} value={country} />
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{t('inviteRepSection')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-y-2">
            <Label htmlFor="invite-registrant-email">{t('inviteRepEmail')}</Label>
            <Input
              disabled={loading}
              id="invite-registrant-email"
              onChange={e => setRegistrantEmail(e.target.value)}
              placeholder={t('inviteRepEmailPlaceholder')}
              type="email"
              value={registrantEmail}
            />
          </div>
        </div>
      </div>
    </ActionDialog>
  )
}

export const OrgCreateDialog = ({
  onCloseAutoFocus,
  onCreate,
  onOpenChange,
  open,
}: {
  onCloseAutoFocus?: (event: Event) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: { name: string; email: string; city: string; country: string; url?: string }) => Promise<void>
}) => {
  const t = useTranslations('Admin.organizations')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCountryChange = (value: string | React.ChangeEvent<HTMLButtonElement>) =>
    typeof value === 'string' && setCountry(value)

  const resetForm = () => {
    setName('')
    setEmail('')
    setCity('')
    setCountry('')
    setUrl('')
  }

  const handleSubmit = async () => {
    if (!(name.trim() && email.trim() && city.trim() && country)) {
      toast.error(t('inviteErrorMissingFields'))
      return
    }

    try {
      setLoading(true)
      await onCreate({
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
        country,
        url: url.trim() || undefined,
      })
      resetForm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  return (
    <ActionDialog
      onCloseAutoFocus={onCloseAutoFocus}
      busy={loading}
      cancelLabel={t('cancel')}
      confirmLabel={t('createSubmit')}
      description={t('createDescription')}
      loadingLabel={t('creating')}
      onConfirm={handleSubmit}
      onOpenChange={handleOpenChange}
      open={open}
      title={t('createTitle')}
    >
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2 flex flex-col gap-y-2">
          <Label htmlFor="create-name">{t('inviteOrgName')}</Label>
          <Input
            autoFocus
            disabled={loading}
            id="create-name"
            onChange={e => setName(e.target.value)}
            placeholder={t('inviteOrgNamePlaceholder')}
            value={name}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="create-org-email">{t('inviteOrgEmail')}</Label>
          <Input
            disabled={loading}
            id="create-org-email"
            onChange={e => setEmail(e.target.value)}
            placeholder={t('inviteOrgEmailPlaceholder')}
            type="email"
            value={email}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="create-url">{t('inviteOrgUrl')}</Label>
          <Input
            disabled={loading}
            id="create-url"
            onChange={e => setUrl(e.target.value)}
            placeholder={t('inviteOrgUrlPlaceholder')}
            type="url"
            value={url}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="create-city">{t('inviteCity')}</Label>
          <Input
            disabled={loading}
            id="create-city"
            onChange={e => setCity(e.target.value)}
            placeholder={t('inviteCityPlaceholder')}
            value={city}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>{t('inviteCountry')}</Label>
          <CountrySelect onChange={handleCountryChange} value={country} />
        </div>
      </div>
    </ActionDialog>
  )
}
