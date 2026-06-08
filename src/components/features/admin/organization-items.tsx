'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CheckIcon, ChevronRightIcon, MailIcon, MapPinIcon, MoreHorizontalIcon, UsersIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import { CountrySelect, countryCodeToFlag } from '@/components/ui/country-select'
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
import { SearchHighlight } from '@/components/ui/search'
import { Textarea } from '@/components/ui/textarea'
import { type AdminOrganization } from '@/db/queries/organization'
import { useI18n } from '@/hooks/use-i18n'
import { type MessageKey } from '@/lib/i18n'

export const OrgRow = ({
  onApprove,
  onReject,
  org,
  query,
}: {
  org: AdminOrganization
  onApprove: (org: AdminOrganization) => void
  onReject: (org: AdminOrganization) => void
  query?: string
}) => {
  const { locale } = useI18n()
  const t = useTranslations('Admin.organizations')
  const tCountries = useTranslations('Intl.Countries')

  const translateCountry = (code: string) => {
    const key = code as MessageKey<'Intl.Countries'>
    return tCountries.has(key) ? tCountries(key) : key.toUpperCase()
  }

  const country = org.country && `${translateCountry(org.country)} ${countryCodeToFlag(org.country)}`
  const location = [org.city, country].filter(Boolean).join(', ')
  const createdAt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(org.createdAt))

  return (
    <div className="group relative flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40">
      <Link aria-label={org.name} className="absolute inset-0" href={`/admin/organizations/${org.id}`} />
      <Avatar className="size-10 shrink-0 rounded-lg">
        {org.avatarUrl && <AvatarImage alt={org.name} src={org.avatarUrl} />}
        <AvatarFallback className="rounded-lg bg-muted text-sm font-medium">
          {org.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            <SearchHighlight query={query} value={org.name} />
          </p>
          {org.isPending && (
            <Badge className="shrink-0 bg-amber-500/10 text-amber-600 capitalize" size="sm" variant="ghost">
              {t('statusPending')}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
          {location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3.5 shrink-0" />
              {location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3.5 shrink-0" />
            {t('memberCount', { count: org.memberCount })}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <MailIcon className="size-3.5 shrink-0" />
            <span className="truncate">{org.email}</span>
          </span>
        </div>
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:block">{createdAt}</span>
        {org.isPending && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={t('actions')} size="icon" variant="ghost">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
              <DropdownMenuItem className="text-[13px]" onClick={() => onApprove(org)}>
                <CheckIcon className="size-3" />
                {t('approve')}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]" onClick={() => onReject(org)} variant="destructive">
                <XIcon className="size-3" />
                {t('reject')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <ChevronRightIcon className="size-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      </div>
    </div>
  )
}

export const ApproveDialog = ({
  onConfirm,
  onOpenChange,
  open,
  org,
}: {
  org: AdminOrganization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (comment?: string) => Promise<void>
}) => {
  const t = useTranslations('Admin.organizations')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm(comment.trim() || undefined)
      setComment('')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setComment('')
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('approveTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('approveDescription', { name: org?.name ?? '' })}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-y-2 px-1">
          <Label htmlFor="approve-comment">
            {t('commentLabel')}{' '}
            <span className="text-muted-foreground">
              {'('}
              {t('optional')}
              {')'}
            </span>
          </Label>
          <Textarea
            disabled={loading}
            id="approve-comment"
            onChange={e => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            rows={2}
            value={comment}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction loading={loading} loadingText={t('approving')} onClick={handleConfirm}>
            {t('approve')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const RejectDialog = ({
  onConfirm,
  onOpenChange,
  open,
  org,
}: {
  org: AdminOrganization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (comment?: string) => Promise<void>
}) => {
  const t = useTranslations('Admin.organizations')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm(comment.trim() || undefined)
      setComment('')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setComment('')
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('rejectTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('rejectDescription', { name: org?.name ?? '' })}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-y-2 px-1">
          <Label htmlFor="reject-comment">
            {t('commentLabel')}{' '}
            <span className="text-muted-foreground">
              {'('}
              {t('optional')}
              {')'}
            </span>
          </Label>
          <Textarea
            disabled={loading}
            id="reject-comment"
            onChange={e => setComment(e.target.value)}
            placeholder={t('rejectCommentPlaceholder')}
            rows={2}
            value={comment}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={loading}
            loadingText={t('rejecting')}
            onClick={handleConfirm}
            variant="destructive"
          >
            {t('reject')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const OrgInviteDialog = ({
  onInvite,
  onOpenChange,
  open,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (data: {
    name: string
    email: string
    city: string
    country: string
    url?: string
    firstName: string
    lastName?: string
    registrantEmail: string
  }) => Promise<void>
}) => {
  const t = useTranslations('Admin.organizations')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [url, setUrl] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
    setFirstName('')
    setLastName('')
    setRegistrantEmail('')
  }

  const handleSubmit = async () => {
    if (!(name.trim() && email.trim() && city.trim() && country && firstName.trim() && registrantEmail.trim())) {
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
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
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
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inviteTitle')}</DialogTitle>
          <DialogDescription>{t('inviteDescription')}</DialogDescription>
        </DialogHeader>
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
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="invite-first-name">{t('inviteFirstName')}</Label>
              <Input
                disabled={loading}
                id="invite-first-name"
                onChange={e => setFirstName(e.target.value)}
                placeholder={t('inviteFirstNamePlaceholder')}
                value={firstName}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="invite-last-name">{t('inviteLastName')}</Label>
              <Input
                disabled={loading}
                id="invite-last-name"
                onChange={e => setLastName(e.target.value)}
                placeholder={t('inviteLastNamePlaceholder')}
                value={lastName}
              />
            </div>
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
        <DialogFooter>
          <Button disabled={loading} onClick={() => handleOpenChange(false)} variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={loading}
            loading={loading}
            loadingText={t('inviting')}
            onClick={handleSubmit}
            variant="brand"
          >
            {t('inviteSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const OrgCreateDialog = ({
  onCreate,
  onOpenChange,
  open,
}: {
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
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>{t('createDescription')}</DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <Button disabled={loading} onClick={() => handleOpenChange(false)} variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={loading}
            loading={loading}
            loadingText={t('creating')}
            onClick={handleSubmit}
            variant="brand"
          >
            {t('createSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
