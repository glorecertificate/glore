'use client'

import { memo, useCallback, useMemo, useState } from 'react'

import { Building2Icon, CheckIcon, MoreHorizontalIcon, PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { approveOrganization, getOrganizations, inviteOrganization, rejectOrganization } from '@/actions/admin'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountrySelect } from '@/components/ui/country-select'
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
import { Textarea } from '@/components/ui/textarea'
import { type AdminOrganization } from '@/db/queries/organization'
import { cn } from '@/lib/utils'

type OrgFilter = 'all' | 'pending' | 'approved'

const OrgRow = memo(
  ({
    onApprove,
    onReject,
    org,
  }: {
    org: AdminOrganization
    onApprove: (org: AdminOrganization) => void
    onReject: (org: AdminOrganization) => void
  }) => {
    const t = useTranslations('Admin.organizations')

    return (
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
        <div className="flex items-center gap-4">
          <Avatar className="size-10 rounded-lg">
            <AvatarFallback className="rounded-lg bg-muted text-sm font-medium">
              {org.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{org.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {[org.city, org.country].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {org.registrationRequest && (
            <p className="hidden text-sm text-muted-foreground sm:block">{org.registrationRequest.fullName}</p>
          )}
          <Badge
            className={cn(
              'capitalize',
              org.isApproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
            )}
            variant="ghost"
          >
            {org.isApproved ? t('statusApproved') : t('statusPending')}
          </Badge>
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
        </div>
      </div>
    )
  }
)

const ApproveDialog = memo(
  ({
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

    const handleConfirm = useCallback(async () => {
      try {
        setLoading(true)
        await onConfirm(comment.trim() || undefined)
        setComment('')
      } finally {
        setLoading(false)
      }
    }, [comment, onConfirm])

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) setComment('')
        onOpenChange(open)
      },
      [onOpenChange]
    )

    return (
      <AlertDialog onOpenChange={handleOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('approveDescription', { name: org?.name ?? '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-2 px-1">
            <Label htmlFor="approve-comment">
              {t('commentLabel')} <span className="text-muted-foreground">({t('optional')})</span>
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
)

const RejectDialog = memo(
  ({
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

    const handleConfirm = useCallback(async () => {
      try {
        setLoading(true)
        await onConfirm(comment.trim() || undefined)
        setComment('')
      } finally {
        setLoading(false)
      }
    }, [comment, onConfirm])

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) setComment('')
        onOpenChange(open)
      },
      [onOpenChange]
    )

    return (
      <AlertDialog onOpenChange={handleOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rejectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('rejectDescription', { name: org?.name ?? '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-2 px-1">
            <Label htmlFor="reject-comment">
              {t('commentLabel')} <span className="text-muted-foreground">({t('optional')})</span>
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
)

const InviteDialog = memo(
  ({
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

    const handleCountryChange = useCallback(
      (value: string | React.ChangeEvent<HTMLButtonElement>) => typeof value === 'string' && setCountry(value),
      []
    )

    const resetForm = useCallback(() => {
      setName('')
      setEmail('')
      setCity('')
      setCountry('')
      setUrl('')
      setFirstName('')
      setLastName('')
      setRegistrantEmail('')
    }, [])

    const handleSubmit = useCallback(async () => {
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
    }, [name, email, city, country, url, firstName, lastName, registrantEmail, onInvite, resetForm, onOpenChange, t])

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) resetForm()
        onOpenChange(open)
      },
      [onOpenChange, resetForm]
    )

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
              <div className="col-span-2 flex flex-col space-y-2">
                <Label htmlFor="invite-name">{t('inviteOrgName')}</Label>
                <Input
                  disabled={loading}
                  id="invite-name"
                  onChange={e => setName(e.target.value)}
                  placeholder={t('inviteOrgNamePlaceholder')}
                  value={name}
                />
              </div>
              <div className="flex flex-col space-y-2">
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
              <div className="flex flex-col space-y-2">
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
              <div className="flex flex-col space-y-2">
                <Label htmlFor="invite-city">{t('inviteCity')}</Label>
                <Input
                  disabled={loading}
                  id="invite-city"
                  onChange={e => setCity(e.target.value)}
                  placeholder={t('inviteCityPlaceholder')}
                  value={city}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>{t('inviteCountry')}</Label>
                <CountrySelect onChange={handleCountryChange} value={country} />
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{t('inviteRepSection')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="invite-first-name">{t('inviteFirstName')}</Label>
                <Input
                  disabled={loading}
                  id="invite-first-name"
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={t('inviteFirstNamePlaceholder')}
                  value={firstName}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="invite-last-name">{t('inviteLastName')}</Label>
                <Input
                  disabled={loading}
                  id="invite-last-name"
                  onChange={e => setLastName(e.target.value)}
                  placeholder={t('inviteLastNamePlaceholder')}
                  value={lastName}
                />
              </div>
              <div className="col-span-2 flex flex-col space-y-2">
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
)

export const AdminOrganizations = ({ orgs: initialOrgs }: { orgs: AdminOrganization[] }) => {
  const t = useTranslations('Admin.organizations')

  const [orgs, setOrgs] = useState(initialOrgs)
  const [filter, setFilter] = useState<OrgFilter>('all')
  const [approveTarget, setApproveTarget] = useState<AdminOrganization | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminOrganization | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const displayOrgs = useMemo(() => {
    if (filter === 'pending') return orgs.filter(o => o.isPending)
    if (filter === 'approved') return orgs.filter(o => o.isApproved)
    return orgs
  }, [orgs, filter])

  const pendingCount = useMemo(() => orgs.filter(o => o.isPending).length, [orgs])

  const refreshOrgs = useCallback(async () => {
    const { data } = await getOrganizations({ cache: false })
    if (data) setOrgs(data)
  }, [])

  const handleApprove = useCallback(
    async (comment?: string) => {
      if (!approveTarget) return

      const { error } = await approveOrganization(approveTarget.id, comment)

      if (error) {
        console.error(error)
        toast.error(t('approveError'))
        return
      }

      toast.success(t('approveSuccess', { name: approveTarget.name }))
      setApproveTarget(null)
      refreshOrgs()
    },
    [approveTarget, t, refreshOrgs]
  )

  const handleReject = useCallback(
    async (comment?: string) => {
      if (!rejectTarget) return

      const { error } = await rejectOrganization(rejectTarget.id, comment)

      if (error) {
        console.error(error)
        toast.error(t('rejectError'))
        return
      }

      toast.success(t('rejectSuccess', { name: rejectTarget.name }))
      setRejectTarget(null)
      refreshOrgs()
    },
    [rejectTarget, t, refreshOrgs]
  )

  const handleInvite = useCallback(
    async (data: {
      name: string
      email: string
      city: string
      country: string
      url?: string
      firstName: string
      lastName?: string
      registrantEmail: string
    }) => {
      const { error } = await inviteOrganization(data)

      if (error) {
        console.error(error)
        toast.error(t('inviteError'))
        return
      }

      toast.success(t('inviteSuccess', { name: data.name }))
      refreshOrgs()
    },
    [t, refreshOrgs]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'pending', 'approved'] as OrgFilter[]).map(f => (
            <Button
              className={cn('h-8 text-xs', filter === f && 'bg-accent')}
              key={f}
              onClick={() => setFilter(f)}
              size="sm"
              variant="outline"
            >
              {t(`filter_${f}`)}
              {f === 'pending' && pendingCount > 0 && (
                <Badge className="ml-1 px-1.5" size="sm" variant="primary">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <Button className="gap-2" onClick={() => setInviteOpen(true)} size="sm" variant="outline">
          <PlusIcon className="size-4" />
          {t('inviteOrg')}
        </Button>
      </div>

      {displayOrgs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
          <Building2Icon className="size-10 text-muted-foreground/50" />
          <p className="font-medium">{t('emptyTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('emptyMessage')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayOrgs.map(org => (
            <OrgRow key={org.id} onApprove={setApproveTarget} onReject={setRejectTarget} org={org} />
          ))}
        </div>
      )}

      <ApproveDialog
        onConfirm={handleApprove}
        onOpenChange={open => !open && setApproveTarget(null)}
        open={!!approveTarget}
        org={approveTarget}
      />
      <RejectDialog
        onConfirm={handleReject}
        onOpenChange={open => !open && setRejectTarget(null)}
        open={!!rejectTarget}
        org={rejectTarget}
      />
      <InviteDialog onInvite={handleInvite} onOpenChange={setInviteOpen} open={inviteOpen} />
    </div>
  )
}
