'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CameraIcon,
  ChevronsUpDownIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  SearchXIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import {
  confirmAdminOrganizationAvatar,
  createAdminOrganizationAvatarUploadUrl,
  deleteAdminOrganization,
  getAdminOrganization,
  inviteAdminOrganizationMember,
  removeAdminOrganizationAvatar,
  removeAdminOrganizationMember,
  updateAdminOrganization,
  updateAdminOrganizationMemberRole,
} from '@/actions/admin/organizations'
import { InviteMemberDialog } from '@/components/features/organization/invite-dialog'
import { organizationSettingsSchema } from '@/components/features/organization/schemas'
import { getDisplayName } from '@/components/features/organization/utils'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
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
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CountrySelect, countryCodeToFlag } from '@/components/ui/country-select'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type Organization, type OrganizationMember, type OrganizationMembershipRole } from '@/db/queries/organization'
import { type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const ORG_ROLES: OrganizationMembershipRole[] = ['admin', 'representative', 'tutor', 'learner', 'volunteer']
const ROLE_ORDER = new Map(ORG_ROLES.map((role, index) => [role, index]))

type AdminOrganizationData = Organization & { currentUserId: string }
type MemberSortField = 'name' | 'role' | 'joined'

const useAdminOrgTab = () =>
  useQueryState('tab', {
    ...parseAsStringEnum(['members', 'settings']).withDefault('members'),
    history: 'push',
    startTransition,
  })

const OrganizationHeader = ({
  onAvatarUpload,
  organization,
}: {
  onAvatarUpload: (file: File) => Promise<void>
  organization: AdminOrganizationData
}) => {
  const { locale } = useI18n()
  const t = useTranslations('Admin.organizations')
  const tCountries = useTranslations('Intl.Countries')

  const translateCountry = (code: string) => {
    const key = code as MessageKey<'Intl.Countries'>
    return tCountries.has(key) ? tCountries(key) : key.toUpperCase()
  }

  const country =
    organization.country && `${translateCountry(organization.country)} ${countryCodeToFlag(organization.country)}`
  const location = [organization.city, country].filter(Boolean).join(', ')
  const createdAt = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(organization.createdAt))

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="h-20 bg-linear-to-r from-brand/15 via-brand/5 to-transparent" />
      <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end">
        <ImageCropper
          onChange={onAvatarUpload}
          trigger={
            <div className="group relative -mt-12 size-20 shrink-0">
              <Avatar className="size-20 rounded-2xl border border-border shadow-2xs">
                {organization.avatarUrl && <AvatarImage alt={organization.name} src={organization.avatarUrl} />}
                <AvatarFallback className="rounded-2xl bg-muted text-2xl font-semibold">
                  {organization.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-foreground/0 transition-colors group-hover:bg-foreground/40">
                <CameraIcon className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          }
          value={organization.avatarUrl}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{organization.name}</h1>
            <Badge
              className={cn(
                'capitalize',
                organization.approvedAt ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              )}
              variant="ghost"
            >
              {organization.approvedAt ? t('filter_active') : t('statusPending')}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1.25">
                <MapPinIcon className="size-3.5 shrink-0" />
                {location}
              </span>
            )}
            <span className="flex min-w-0 items-center gap-1">
              <MailIcon className="size-3.5 shrink-0" />
              <span className="truncate">{organization.email}</span>
            </span>
            {organization.url && (
              <a className="group flex items-center gap-1.25" href={organization.url} rel="noreferrer" target="_blank">
                <GlobeIcon className="size-3.5 shrink-0" />
                <span className="transition-colors group-hover:text-foreground group-hover:underline">
                  {organization.url.replace(/^https?:\/\//u, '')}
                </span>
              </a>
            )}
            <span className="flex items-center gap-1.25">
              <UsersIcon className="size-3.5 shrink-0" />
              {t('memberCount', { count: organization.memberships.length })}
            </span>
            <span className="flex items-center gap-1.25">
              <CalendarIcon className="size-3.5 shrink-0" />
              {createdAt}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const MEMBER_GRID = 'grid grid-cols-[minmax(0,1fr)_9rem_7rem_9rem_2.5rem] items-center gap-3 px-4'

const SortButton = ({
  active,
  children,
  direction,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  direction: 'asc' | 'desc'
  onClick: () => void
}) => (
  <button
    className="-mx-1 inline-flex w-fit items-center gap-1 rounded-sm px-1 py-0.5 transition-colors hover:text-foreground"
    onClick={onClick}
    type="button"
  >
    {children}
    {active ? (
      direction === 'asc' ? (
        <ArrowUpIcon className="size-3" />
      ) : (
        <ArrowDownIcon className="size-3" />
      )
    ) : (
      <ChevronsUpDownIcon className="size-3 opacity-40" />
    )}
  </button>
)

const OrganizationMembersTab = ({
  members,
  onRefresh,
  organizationId,
}: {
  members: OrganizationMember[]
  onRefresh: () => void
  organizationId: number
}) => {
  const { locale } = useI18n()
  const t = useTranslations('Organization')
  const tAdmin = useTranslations('Admin.organizations')

  const [activeMembershipId, setActiveMembershipId] = useState<number | null>(null)
  const [deleteMembershipId, setDeleteMembershipId] = useState<number | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | OrganizationMembershipRole>('all')
  const [sort, setSort] = useState<MemberSortField>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const hasFilters = search.trim() !== '' || roleFilter !== 'all'

  const displayMembers = (() => {
    let list = members

    if (roleFilter !== 'all') list = list.filter(m => m.role === roleFilter)

    const needle = search.trim().toLowerCase()
    if (needle) {
      list = list.filter(m =>
        [m.fullName, m.user.email, m.user.username].some(value => value?.toLowerCase().includes(needle))
      )
    }

    const factor = sortDir === 'asc' ? 1 : -1
    return list.toSorted((a, b) => {
      if (sort === 'role') return ((ROLE_ORDER.get(a.role) ?? 0) - (ROLE_ORDER.get(b.role) ?? 0)) * factor
      if (sort === 'joined') return a.createdAt.localeCompare(b.createdAt) * factor
      return (a.fullName || a.user.email).localeCompare(b.fullName || b.user.email, locale) * factor
    })
  })()

  const toggleSort = (field: MemberSortField) => {
    if (sort === field) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSort(field)
    setSortDir('asc')
  }

  const handleInvite = async (values: {
    email: string
    firstName: string
    lastName: string
    locale: string
    role: OrganizationMembershipRole
  }) => {
    const { data, error } = await inviteAdminOrganizationMember(organizationId, values)

    if (error || !data) {
      toast.error(error?.message ?? t('inviteError'))
      return
    }

    toast.success(t('inviteSuccess', { email: data.email }))

    if (!data.emailSent) {
      toast.warning(t('inviteEmailFailed'))
    }

    onRefresh()
  }

  const handleRoleChange = async (membershipId: number, role: OrganizationMembershipRole) => {
    setActiveMembershipId(membershipId)

    const { error } = await updateAdminOrganizationMemberRole(organizationId, membershipId, role)

    setActiveMembershipId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(t('memberRoleUpdated'))
    onRefresh()
  }

  const handleDeleteMember = async () => {
    if (!deleteMembershipId) return

    setActiveMembershipId(deleteMembershipId)
    const { error } = await removeAdminOrganizationMember(organizationId, deleteMembershipId)
    setActiveMembershipId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    setDeleteMembershipId(null)
    toast.success(t('memberRemoved'))
    onRefresh()
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{t('membersTitle')}</h2>
            <p className="text-sm text-muted-foreground">{tAdmin('membersDescription')}</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
            <UserPlusIcon className="size-3.5" />
            {t('inviteMember')}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3">
            <SearchInput
              className="h-8 w-full bg-background sm:w-56"
              hotkey="/"
              onValueChange={setSearch}
              placeholder={tAdmin('memberSearchPlaceholder')}
              value={search}
            />
            <Select
              onValueChange={value => setRoleFilter(value as 'all' | OrganizationMembershipRole)}
              value={roleFilter}
            >
              <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tAdmin('allRoles')}</SelectItem>
                {ORG_ROLES.map(role => (
                  <SelectItem key={role} value={role}>
                    {t(`role_${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                className="h-8"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                }}
                size="sm"
                variant="ghost"
              >
                {tAdmin('clearFilters')}
              </Button>
            )}
          </div>

          {members.length === 0 ? (
            <Empty className="py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>{t('noMembers')}</EmptyTitle>
                <EmptyDescription>{t('noMembersDescription')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : displayMembers.length === 0 ? (
            <Empty className="py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>{tAdmin('noMembersFiltered')}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => {
                    setSearch('')
                    setRoleFilter('all')
                  }}
                  size="sm"
                  variant="outline"
                >
                  {tAdmin('clearFilters')}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-170">
                <div className={cn(MEMBER_GRID, 'border-b py-2.5 text-xs font-medium text-muted-foreground')}>
                  <SortButton active={sort === 'name'} direction={sortDir} onClick={() => toggleSort('name')}>
                    {tAdmin('colMember')}
                  </SortButton>
                  <SortButton active={sort === 'role'} direction={sortDir} onClick={() => toggleSort('role')}>
                    {tAdmin('colRole')}
                  </SortButton>
                  <span>{tAdmin('colStatus')}</span>
                  <SortButton active={sort === 'joined'} direction={sortDir} onClick={() => toggleSort('joined')}>
                    {tAdmin('colJoined')}
                  </SortButton>
                  <span className="sr-only">{tAdmin('actions')}</span>
                </div>

                <div className="divide-y">
                  <AnimatedList>
                    {displayMembers.map(member => (
                      <AnimatedListItem
                        className={cn(MEMBER_GRID, 'py-2.5 transition-colors hover:bg-accent/40')}
                        key={member.id}
                        variant="row"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-8 shrink-0 rounded-full">
                            {member.user.avatarUrl && (
                              <AvatarImage alt={member.fullName || member.user.email} src={member.user.avatarUrl} />
                            )}
                            <AvatarFallback className="rounded-full text-xs font-medium">
                              {member.fullName
                                .split(' ')
                                .flatMap(name => (name ? [name.charAt(0).toUpperCase()] : []))
                                .slice(0, 2)
                                .join('') || member.user.email.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{getDisplayName(member.user)}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>

                        <Select
                          disabled={activeMembershipId === member.id}
                          onValueChange={value => handleRoleChange(member.id, value as OrganizationMembershipRole)}
                          value={member.role}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORG_ROLES.map(role => (
                              <SelectItem key={role} value={role}>
                                {t(`role_${role}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Badge
                          className={cn(
                            'w-fit',
                            member.isPending ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                          )}
                          variant="ghost"
                        >
                          {member.isPending ? t('statusPending') : t('statusJoined')}
                        </Badge>

                        <span className="text-sm text-muted-foreground">
                          {dateFormatter.format(new Date(member.createdAt))}
                        </span>

                        <Button
                          aria-label={t('removeMember')}
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={activeMembershipId === member.id}
                          onClick={() => setDeleteMembershipId(member.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </AnimatedListItem>
                    ))}
                  </AnimatedList>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InviteMemberDialog
        allowedRoles={ORG_ROLES}
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

const OrganizationSettingsTab = ({
  onAvatarRemove,
  onAvatarUpload,
  onDeleted,
  onRefresh,
  organization,
}: {
  onAvatarRemove: () => Promise<void>
  onAvatarUpload: (file: File) => Promise<void>
  onDeleted: () => void
  onRefresh: () => void
  organization: AdminOrganizationData
}) => {
  const { localize } = useI18n()
  const t = useTranslations('Organization')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<z.infer<typeof organizationSettingsSchema>>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      address: organization.address ?? '',
      city: organization.city ?? '',
      country: organization.country ?? '',
      description: organization.description ? localize(organization.description) : '',
      email: organization.email ?? '',
      name: organization.name ?? '',
      phone: organization.phone ?? '',
      postcode: organization.postcode ?? '',
      region: organization.region ?? '',
      url: organization.url ?? '',
    },
  })

  const handleSubmit = async (values: z.infer<typeof organizationSettingsSchema>) => {
    const { error } = await updateAdminOrganization(organization.id, values)

    if (error) {
      toast.error(typeof error === 'string' ? error : error.message)
      return
    }

    toast.success(t('settingsUpdated'))
    onRefresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteAdminOrganization(organization.id)
    setDeleting(false)

    if (error) {
      toast.error(typeof error === 'string' ? error : error.message)
      return
    }

    setDeleteOpen(false)
    toast.success(t('organizationDeleted'))
    onDeleted()
  }

  return (
    <>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(handleSubmit)}>
          <SettingsSection description={t('brandingDescription')} title={t('branding')}>
            <ImageCropper
              fallback={organization.name.slice(0, 2).toUpperCase()}
              onChange={onAvatarUpload}
              onRemove={onAvatarRemove}
              value={organization.avatarUrl}
            />
          </SettingsSection>

          <Separator />

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
                      <PhoneInput onChange={field.onChange} placeholder={t('phonePlaceholder')} value={field.value} />
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

          <Separator />

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

          <div className="flex justify-end">
            <Button
              disabled={form.formState.isSubmitting}
              loading={form.formState.isSubmitting}
              loadingText={t('saving')}
              type="submit"
            >
              {t('saveChanges')}
            </Button>
          </div>

          <Separator />

          <SettingsSection description={t('dangerDescription')} title={t('dangerZone')}>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base text-destructive">{t('deleteOrganizationTitle')}</CardTitle>
                <CardDescription>{t('deleteOrganizationHelp')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setDeleteOpen(true)} type="button" variant="destructive">
                  {t('deleteOrganization')}
                </Button>
              </CardContent>
            </Card>
          </SettingsSection>
        </form>
      </Form>

      <AlertDialog onOpenChange={open => !deleting && setDeleteOpen(open)} open={deleteOpen}>
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
              onClick={handleDelete}
              variant="destructive"
            >
              {t('deleteOrganization')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const AdminOrganizationDetail = ({ initialData }: { initialData: AdminOrganizationData }) => {
  const { push, refresh: routerRefresh } = useRouter()
  const t = useTranslations('Organization')
  const { updateOrganization } = useSession()
  const [tab, setTab] = useAdminOrgTab()

  const [data, setData] = useState(initialData)

  const refresh = async () => {
    const { data: next } = await getAdminOrganization(data.id)
    if (next) setData(next)
    startTransition(() => routerRefresh())
  }

  const handleAvatarUpload = async (file: File) => {
    const { data: presign, error: presignError } = await createAdminOrganizationAvatarUploadUrl(data.id, file.type)

    if (presignError || !presign) {
      toast.error(typeof presignError === 'string' ? presignError : t('avatarUploadError'))
      return
    }

    const res = await fetch(presign.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    if (!res.ok) {
      toast.error(t('avatarUploadError'))
      return
    }

    const result = await confirmAdminOrganizationAvatar(data.id, presign.key)

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : result.error.message)
      return
    }
    if (!('data' in result) || !result.data) {
      toast.error(t('avatarUploadError'))
      return
    }

    updateOrganization(data.id, { avatarUrl: result.data.avatarUrl })
    toast.success(t('avatarUploaded'))
    refresh()
  }

  const handleAvatarRemove = async () => {
    const { error } = await removeAdminOrganizationAvatar(data.id)

    if (error) {
      toast.error(typeof error === 'string' ? error : error.message)
      return
    }

    updateOrganization(data.id, { avatarUrl: null })
    toast.success(t('avatarRemoved'))
    refresh()
  }

  const handleDeleted = () => {
    push('/admin/organizations')
    startTransition(() => routerRefresh())
  }

  return (
    <div className="space-y-6 pb-12">
      <OrganizationHeader onAvatarUpload={handleAvatarUpload} organization={data} />
      <Tabs onValueChange={value => setTab(value as 'members' | 'settings')} value={tab}>
        <TabsList>
          <TabsTrigger count={data.memberships.length} showZero value="members">
            {t('members')}
          </TabsTrigger>
          <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
        </TabsList>
        <TabsContent className="pt-4" value="members">
          <OrganizationMembersTab members={data.memberships} onRefresh={refresh} organizationId={data.id} />
        </TabsContent>
        <TabsContent className="pt-4" value="settings">
          <OrganizationSettingsTab
            onAvatarRemove={handleAvatarRemove}
            onAvatarUpload={handleAvatarUpload}
            onDeleted={handleDeleted}
            onRefresh={refresh}
            organization={data}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
