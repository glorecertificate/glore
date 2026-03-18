'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  BadgeCheckIcon,
  Building2Icon,
  FileClockIcon,
  GraduationCapIcon,
  HandHeartIcon,
  MailIcon,
  ShieldUserIcon,
  Trash2Icon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  type OrganizationPanelData,
  approveOrganizationJoinRequest,
  deleteOrganization,
  inviteOrganizationMember,
  rejectOrganizationJoinRequest,
  removeOrganizationAvatar,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMemberRole,
  uploadOrganizationAvatar,
} from '@/actions/organization'
import { useOrganizationTab } from '@/components/features/organization/tabs'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CountrySelect } from '@/components/ui/country-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSelect } from '@/components/ui/language-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { type OrganizationMembershipRole } from '@/db/queries/organization'
import { type User } from '@/db/queries/user'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { defaultFormDisabled } from '@/lib/utils'

const MANAGEABLE_MEMBER_ROLES: OrganizationMembershipRole[] = ['learner', 'representative', 'tutor', 'volunteer']
const REPRESENTATIVE_INVITE_ROLES: OrganizationMembershipRole[] = ['learner', 'tutor', 'volunteer']

const organizationSettingsSchema = z.object({
  address: z.string(),
  city: z.string().min(1),
  country: z.string(),
  description: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string(),
  postcode: z.string(),
  region: z.string(),
  url: z.string(),
})

const getDisplayName = ({
  email,
  firstName,
  lastName,
  username,
}: {
  email: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
}) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  if (firstName) {
    return firstName
  }

  if (username) {
    return `@${username}`
  }

  return email
}

const formatRoleLabel = (role: OrganizationMembershipRole, t: ReturnType<typeof useTranslations<'Organization'>>) =>
  t(`role_${role}`)

const SettingsSection = ({
  children,
  description,
  title,
}: React.PropsWithChildren<{ description: string; title: string }>) => (
  <section className="grid gap-6 md:grid-cols-[minmax(220px,1fr)_2fr]">
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{description}</p>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
)

const InviteMemberDialog = ({
  allowedRoles,
  defaultLocale,
  onInvite,
  onOpenChange,
  open,
}: {
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
}) => {
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

const RejectRequestDialog = ({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: (comment: string) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Organization')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = useCallback(async () => {
    try {
      setSubmitting(true)
      await onConfirm(comment)
      setComment('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }, [comment, onConfirm, onOpenChange])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rejectRequestTitle')}</DialogTitle>
          <DialogDescription>{t('rejectRequestDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="organization-request-comment">{t('optionalMessage')}</Label>
          <Textarea
            id="organization-request-comment"
            onChange={e => setComment(e.target.value)}
            placeholder={t('optionalMessagePlaceholder')}
            value={comment}
          />
        </div>
        <DialogFooter>
          <Button disabled={submitting} onClick={() => onOpenChange(false)} variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={submitting}
            loading={submitting}
            loadingText={t('rejecting')}
            onClick={handleConfirm}
            variant="destructive"
          >
            {t('reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const OrganizationDeleteDialog = ({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Organization')
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = useCallback(async () => {
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }, [onConfirm])

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteOrganizationTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteOrganizationDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={deleting}
            loadingText={t('deleting')}
            onClick={handleConfirm}
            variant="destructive"
          >
            {t('deleteOrganization')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const OrganizationPanel = ({ initialData }: { initialData: OrganizationPanelData }) => {
  const router = useRouter()
  const { locale, localize } = useI18n()
  const { organization, setOrganization, setUser } = useSession()
  const { tab } = useOrganizationTab()

  const t = useTranslations('Organization')

  const [data, setData] = useState(initialData)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteMembershipId, setDeleteMembershipId] = useState<number | null>(null)
  const [deleteOrganizationOpen, setDeleteOrganizationOpen] = useState(false)
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null)
  const [activeMembershipId, setActiveMembershipId] = useState<number | null>(null)
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const form = useForm<z.infer<typeof organizationSettingsSchema>>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      address: data.organization.address ?? '',
      city: data.organization.city ?? '',
      country: data.organization.country ?? '',
      description: data.organization.description ? localize(data.organization.description) : '',
      email: data.organization.email ?? '',
      name: data.organization.name ?? '',
      phone: data.organization.phone ?? '',
      postcode: data.organization.postcode ?? '',
      region: data.organization.region ?? '',
      url: data.organization.url ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      address: data.organization.address ?? '',
      city: data.organization.city ?? '',
      country: data.organization.country ?? '',
      description: data.organization.description ? localize(data.organization.description) : '',
      email: data.organization.email ?? '',
      name: data.organization.name ?? '',
      phone: data.organization.phone ?? '',
      postcode: data.organization.postcode ?? '',
      region: data.organization.region ?? '',
      url: data.organization.url ?? '',
    })
  }, [data.organization, form, localize])

  const currentTab = !data.isOrgAdmin && tab === 'settings' ? 'overview' : tab
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])
  const availableInviteRoles = useMemo<OrganizationMembershipRole[]>(
    () => (data.isOrgAdmin ? [...MANAGEABLE_MEMBER_ROLES] : [...REPRESENTATIVE_INVITE_ROLES]),
    [data.isOrgAdmin]
  )

  const canDeleteMembership = useCallback(
    (role: OrganizationMembershipRole, userId: string) => {
      if (userId === data.currentUserId) {
        return false
      }

      if (data.isOrgAdmin) {
        return true
      }

      return REPRESENTATIVE_INVITE_ROLES.some(item => item === role)
    },
    [data.currentUserId, data.isOrgAdmin]
  )

  const refresh = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router])

  const syncUser = useCallback(
    (nextUser: User) => {
      setUser(nextUser)
      const nextOrganization = nextUser.organizations[0]

      if (nextOrganization?.id) {
        setOrganization(nextOrganization.id)
      }
    },
    [setOrganization, setUser]
  )

  const handleInvite = useCallback(
    async (values: {
      email: string
      firstName: string
      lastName: string
      locale: string
      role: OrganizationMembershipRole
    }) => {
      const { data, error } = await inviteOrganizationMember(values)

      if (error || !data) {
        toast.error(error?.message ?? t('inviteError'))
        return
      }

      toast.success(t('inviteSuccess', { email: data.email }))
      refresh()
    },
    [refresh, t]
  )

  const handleRoleChange = useCallback(
    async (membershipId: number, role: OrganizationMembershipRole) => {
      setActiveMembershipId(membershipId)

      const { error } = await updateOrganizationMemberRole(membershipId, role)

      setActiveMembershipId(null)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(t('memberRoleUpdated'))
      refresh()
    },
    [refresh, t]
  )

  const handleDeleteMember = useCallback(async () => {
    if (!deleteMembershipId) {
      return
    }

    setActiveMembershipId(deleteMembershipId)
    const { error } = await removeOrganizationMember(deleteMembershipId)
    setActiveMembershipId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    setDeleteMembershipId(null)
    toast.success(t('memberRemoved'))
    refresh()
  }, [deleteMembershipId, refresh, t])

  const handleApproveRequest = useCallback(
    async (requestId: number) => {
      setActiveRequestId(requestId)

      const { error } = await approveOrganizationJoinRequest(requestId)

      setActiveRequestId(null)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(t('joinRequestApproved'))
      refresh()
    },
    [refresh, t]
  )

  const handleRejectRequest = useCallback(
    async (comment: string) => {
      if (!rejectRequestId) {
        return
      }

      setActiveRequestId(rejectRequestId)

      const { error } = await rejectOrganizationJoinRequest(rejectRequestId, comment)

      setActiveRequestId(null)

      if (error) {
        toast.error(error.message)
        return
      }

      setRejectRequestId(null)
      toast.success(t('joinRequestRejected'))
      refresh()
    },
    [refresh, rejectRequestId, t]
  )

  const handleSettingsSubmit = useCallback(
    async (values: z.infer<typeof organizationSettingsSchema>) => {
      const { data: result, error } = await updateOrganization(values)

      if (error || !result) {
        toast.error(error?.message ?? t('settingsUpdateError'))
        return
      }

      syncUser(result.user)
      toast.success(t('settingsUpdated'))
      refresh()
    },
    [refresh, syncUser, t]
  )

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const { data: result, error } = await uploadOrganizationAvatar(formData)

      if (error || !result) {
        toast.error(error?.message ?? t('avatarUploadError'))
        return
      }

      syncUser(result.user)
      toast.success(t('avatarUploaded'))
      refresh()
    },
    [refresh, syncUser, t]
  )

  const handleAvatarRemove = useCallback(async () => {
    const { data: result, error } = await removeOrganizationAvatar()

    if (error || !result) {
      toast.error(error?.message ?? t('avatarRemoveError'))
      return
    }

    syncUser(result.user)
    toast.success(t('avatarRemoved'))
    refresh()
  }, [refresh, syncUser, t])

  const handleDeleteOrganization = useCallback(async () => {
    const { data: result, error } = await deleteOrganization()

    if (error || !result) {
      toast.error(error?.message ?? t('deleteOrganizationError'))
      return
    }

    syncUser(result.user)
    setDeleteOrganizationOpen(false)
    toast.success(t('organizationDeleted'))
    router.push('/dashboard')
    refresh()
  }, [refresh, router, syncUser, t])

  const settingsDisabled = defaultFormDisabled(form)

  if (currentTab === 'members') {
    return (
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('membersTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('membersDescription')}</p>
            </div>
            <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
              <UserPlusIcon className="size-3.5" />
              {t('inviteMember')}
            </Button>
          </div>

          <div className="space-y-3">
            {data.members.map(member => (
              <Card key={member.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-11 rounded-full">
                      {member.user.avatarUrl && (
                        <AvatarImage alt={member.fullName || member.user.email} src={member.user.avatarUrl} />
                      )}
                      <AvatarFallback className="rounded-full text-sm font-medium">
                        {member.fullName
                          .split(' ')
                          .filter(Boolean)
                          .map(name => name.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join('') || member.user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{getDisplayName(member.user)}</p>
                        {member.user.id === data.currentUserId && (
                          <Badge size="sm" variant="outline">
                            {t('you')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="ghost">{formatRoleLabel(member.role, t)}</Badge>
                        <Badge variant="ghost">{member.isPending ? t('statusPending') : t('statusJoined')}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:min-w-56 sm:items-end">
                    {data.isOrgAdmin && member.user.id !== data.currentUserId ? (
                      <Select
                        disabled={activeMembershipId === member.id}
                        onValueChange={value => handleRoleChange(member.id, value as OrganizationMembershipRole)}
                        value={member.role}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MANAGEABLE_MEMBER_ROLES.map(role => (
                            <SelectItem key={role} value={role}>
                              {t(`role_${role}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t('memberSince', { date: dateFormatter.format(new Date(member.createdAt)) })}
                      </p>
                    )}

                    {canDeleteMembership(member.role, member.user.id) && (
                      <Button
                        disabled={activeMembershipId === member.id}
                        onClick={() => setDeleteMembershipId(member.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2Icon className="size-3.5" />
                        {t('removeMember')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <InviteMemberDialog
          allowedRoles={availableInviteRoles}
          defaultLocale={locale}
          onInvite={handleInvite}
          onOpenChange={setInviteOpen}
          open={inviteOpen}
        />

        <AlertDialog onOpenChange={open => !open && setDeleteMembershipId(null)} open={!!deleteMembershipId}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('removeMemberDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={activeMembershipId === deleteMembershipId}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                loading={activeMembershipId === deleteMembershipId}
                loadingText={t('removing')}
                onClick={handleDeleteMember}
                variant="destructive"
              >
                {t('removeMember')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  if (currentTab === 'joinRequests') {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">{t('joinRequestsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('joinRequestsDescription')}</p>
          </div>

          {data.joinRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <MailIcon className="size-8 text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('noJoinRequests')}</p>
                  <p className="text-xs text-muted-foreground">{t('noJoinRequestsDescription')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.joinRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{request.fullName}</p>
                        <Badge variant="outline">{formatRoleLabel(request.role, t)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      {request.message && <p className="text-sm whitespace-pre-wrap">{request.message}</p>}
                      <p className="text-xs text-muted-foreground">
                        {t('requestedOn', { date: dateFormatter.format(new Date(request.createdAt)) })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        disabled={activeRequestId === request.id}
                        loading={activeRequestId === request.id}
                        onClick={() => handleApproveRequest(request.id)}
                        size="sm"
                        variant="success"
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        disabled={activeRequestId === request.id}
                        onClick={() => setRejectRequestId(request.id)}
                        size="sm"
                        variant="outline"
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <RejectRequestDialog
          onConfirm={handleRejectRequest}
          onOpenChange={open => !open && setRejectRequestId(null)}
          open={!!rejectRequestId}
        />
      </>
    )
  }

  if (currentTab === 'settings' && data.isOrgAdmin) {
    return (
      <>
        <Form {...form}>
          <form className="space-y-0" onSubmit={form.handleSubmit(handleSettingsSubmit)}>
            <SettingsSection description={t('brandingDescription')} title={t('branding')}>
              <ImageCropper
                fallback={
                  organization?.name?.slice(0, 2).toUpperCase() ?? data.organization.name.slice(0, 2).toUpperCase()
                }
                onChange={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                value={organization?.avatarUrl ?? data.organization.avatarUrl}
              />
            </SettingsSection>

            <Separator className="my-8" />

            <SettingsSection description={t('settingsDescription')} title={t('settingsTitle')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('organizationName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('organizationNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('emailPlaceholder')} type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('phonePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('website')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('websitePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('description')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('descriptionPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>

            <Separator className="my-8" />

            <SettingsSection description={t('contactDescription')} title={t('contactDetails')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t('address')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('addressPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('city')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('cityPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('postcode')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('postcodePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('country')}</FormLabel>
                      <FormControl>
                        <CountrySelect onChange={field.onChange} value={field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('region')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('regionPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsSection>

            <Separator className="my-8" />

            <SettingsSection description={t('dangerDescription')} title={t('dangerZone')}>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">{t('deleteOrganizationTitle')}</CardTitle>
                  <CardDescription>{t('deleteOrganizationHelp')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setDeleteOrganizationOpen(true)} type="button" variant="destructive">
                    {t('deleteOrganization')}
                  </Button>
                </CardContent>
              </Card>
            </SettingsSection>

            <div className="mt-8 flex justify-end">
              <Button
                disabled={settingsDisabled || form.formState.isSubmitting}
                loading={form.formState.isSubmitting}
                loadingText={t('saving')}
                type="submit"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </form>
        </Form>

        <OrganizationDeleteDialog
          onConfirm={handleDeleteOrganization}
          onOpenChange={setDeleteOrganizationOpen}
          open={deleteOrganizationOpen}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t('memberCount')}</CardDescription>
            <CardTitle className="text-2xl">{data.stats.memberCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('memberBreakdown', {
              admins: data.stats.adminCount,
              learners: data.stats.learnerCount,
              representatives: data.stats.representativeCount,
              tutors: data.stats.tutorCount,
              volunteers: data.stats.volunteerCount,
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('pendingJoinRequests')}</CardDescription>
            <CardTitle className="text-2xl">{data.pendingJoinRequestsCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <MailIcon className="size-4" />
            {t('pendingJoinRequestsDescription')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('pendingCertificates')}</CardDescription>
            <CardTitle className="text-2xl">{data.pendingCertificatesCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileClockIcon className="size-4" />
            {t('pendingCertificatesDescription')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('approvedCertificates')}</CardDescription>
            <CardTitle className="text-2xl">{data.approvedCertificatesCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheckIcon className="size-4" />
            {t('approvedCertificatesDescription')}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardDescription>{t('overviewDescription')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2Icon className="size-5" />
              {data.organization.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.organization.description && (
              <p className="text-sm leading-6">{localize(data.organization.description)}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/25 p-4">
                <p className="mb-1 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t('contactDetails')}
                </p>
                <div className="space-y-1 text-sm">
                  <p>{data.organization.email}</p>
                  {data.organization.phone && <p>{data.organization.phone}</p>}
                  {data.organization.url && (
                    <a
                      className="text-link hover:underline"
                      href={data.organization.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {data.organization.url}
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/25 p-4">
                <p className="mb-1 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t('location')}
                </p>
                <div className="space-y-1 text-sm">
                  <p>{[data.organization.address, data.organization.city].filter(Boolean).join(', ')}</p>
                  <p>{[data.organization.region, data.organization.country].filter(Boolean).join(', ')}</p>
                  {data.organization.postcode && <p>{data.organization.postcode}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('activitySnapshot')}</CardDescription>
            <CardTitle>{t('teamSnapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <ShieldUserIcon className="size-4 text-muted-foreground" />
                {t('admins')}
              </div>
              <span className="font-medium">{data.stats.adminCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" />
                {t('representatives')}
              </div>
              <span className="font-medium">{data.stats.representativeCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <UserCheckIcon className="size-4 text-muted-foreground" />
                {t('tutors')}
              </div>
              <span className="font-medium">{data.stats.tutorCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <HandHeartIcon className="size-4 text-muted-foreground" />
                {t('volunteers')}
              </div>
              <span className="font-medium">{data.stats.volunteerCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCapIcon className="size-4 text-muted-foreground" />
                {t('learners')}
              </div>
              <span className="font-medium">{data.stats.learnerCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 text-muted-foreground" />
                {t('pendingAccounts')}
              </div>
              <span className="font-medium">{data.stats.pendingMemberCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
