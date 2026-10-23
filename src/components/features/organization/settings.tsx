'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import {
  confirmOrganizationAvatar,
  createOrganizationAvatarUploadUrl,
  deleteOrganization,
  removeOrganizationAvatar,
  updateOrganization,
} from '@/actions/organizations/settings'
import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CountrySelect } from '@/components/ui/country-select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { type User } from '@/db/queries/user'
import { type IntlRecord, LOCALES } from '@/lib/i18n'
import { defaultFormDisabled } from '@/lib/utils'

import { OrganizationAvatarMenu } from './avatar-menu'
import { DeleteOrganizationDialog } from './delete-organization-dialog'
import { organizationSettingsSchema } from './schemas'
import { SettingsSection } from './settings-section'
import { SignatureUpload } from './signature-upload'
import { TransferOwnershipDialog } from './transfer-ownership-dialog'
import { useMemberError } from './use-member-error'

type Values = z.infer<ReturnType<typeof organizationSettingsSchema>>
type Locale = keyof IntlRecord

interface OrganizationSettingsProps {
  members: OrganizationPanelData['members']
  onRefresh: () => void
  onSyncUser?: (user: User) => void
  organization: OrganizationPanelData['organization']
  organizationId?: number
}

export const OrganizationSettings = ({
  members,
  onRefresh,
  onSyncUser,
  organization,
  organizationId,
}: OrganizationSettingsProps) => {
  const { push } = useRouter()
  const { impersonating, organization: sessionOrg } = useSession()
  const t = useTranslations('Organization')
  const tLanguages = useTranslations('Intl.Languages')
  const memberError = useMemberError()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [descriptionLocale, setDescriptionLocale] = useState<Locale>(LOCALES[0] ?? 'en')

  const platform = organizationId !== undefined
  const candidates = members.filter(member => member.isRepresentative && !member.isPending)

  const form = useForm<Values>({
    resolver: zodResolver(organizationSettingsSchema({ url: t('websiteInvalid') })),
    defaultValues: {
      address: organization.address ?? '',
      city: organization.city ?? '',
      country: organization.country ?? '',
      description: Object.fromEntries(LOCALES.map(locale => [locale, organization.description?.[locale] ?? ''])),
      email: organization.email ?? '',
      legalName: organization.legalName ?? '',
      legalRepresentative: organization.legalRepresentative ?? '',
      name: organization.name ?? '',
      phone: organization.phone ?? '',
      postcode: organization.postcode ?? '',
      region: organization.region ?? '',
      registryId: organization.registryId ?? '',
      url: organization.url ?? '',
    },
  })

  const handleSubmit = async ({ description, ...values }: Values) => {
    const dirty = form.formState.dirtyFields.description ?? {}
    const patch: Partial<Record<Locale, string>> = {}
    for (const locale of LOCALES) {
      if (dirty[locale]) patch[locale] = description[locale]
    }
    const { data, error } = await updateOrganization({ ...values, description: patch }, organizationId)

    if (error || !data) {
      toast.error(error?.code === 'QUERY_ERROR' ? t('settingsUpdateError') : memberError(error?.code))
      return
    }

    onSyncUser?.(data.user)
    toast.success(t('settingsUpdated'))
    onRefresh()
  }

  const handleAvatarUpload = async (file: File) => {
    const { data: presign, error: presignError } = await createOrganizationAvatarUploadUrl(
      file.type,
      file.size,
      organizationId
    )
    if (presignError || !presign) {
      toast.error(t('avatarUploadError'))
      return
    }

    const upload = await fetch(presign.url, { body: file, headers: { 'Content-Type': file.type }, method: 'PUT' })
    if (!upload.ok) {
      toast.error(t('avatarUploadError'))
      return
    }

    const { data, error } = await confirmOrganizationAvatar(presign.key, organizationId)
    if (error || !data) {
      toast.error(t('avatarUploadError'))
      return
    }

    onSyncUser?.(data.user)
    toast.success(t('avatarUploaded'))
    onRefresh()
  }

  const handleAvatarRemove = async () => {
    const { data, error } = await removeOrganizationAvatar(organizationId)
    if (error || !data) {
      toast.error(t('avatarRemoveError'))
      return
    }

    onSyncUser?.(data.user)
    toast.success(t('avatarRemoved'))
    onRefresh()
  }

  const handleDelete = async () => {
    const { data, error } = await deleteOrganization(organizationId)
    if (error || !data) {
      toast.error(error?.code === 'QUERY_ERROR' ? t('deleteOrganizationError') : memberError(error?.code))
      return
    }

    onSyncUser?.(data.user)
    setDeleteOpen(false)
    toast.success(t('organizationDeleted'))
    push(platform ? '/admin/organizations' : '/dashboard')
  }

  const handleTransferred = (user: User) => {
    onSyncUser?.(user)
    onRefresh()
  }

  const disabled = defaultFormDisabled(form)

  return (
    <>
      <Form {...form}>
        <form className="space-y-0" onSubmit={form.handleSubmit(handleSubmit)}>
          <SettingsSection description={t('brandingDescription')} title={t('branding')}>
            <OrganizationAvatarMenu
              fallback={sessionOrg?.name?.slice(0, 2).toUpperCase() ?? organization.name.slice(0, 2).toUpperCase()}
              name={organization.name}
              onAvatarRemove={handleAvatarRemove}
              onAvatarUpload={handleAvatarUpload}
              value={organization.avatarUrl}
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
          </SettingsSection>

          <Separator className="my-8" />

          <SettingsSection description={t('descriptionLocaleHelp')} title={t('description')}>
            <SegmentedControl
              aria-label={t('descriptionLanguage')}
              onValueChange={value => setDescriptionLocale(value as Locale)}
              value={descriptionLocale}
            >
              {LOCALES.map(locale => (
                <SegmentedControlItem key={locale} value={locale}>
                  {tLanguages(locale)}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            <FormField
              control={form.control}
              key={descriptionLocale}
              name={`description.${descriptionLocale}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">
                    {t('descriptionIn', { language: tLanguages(descriptionLocale) })}
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('descriptionPlaceholder')} rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsSection>

          <Separator className="my-8" />

          <SettingsSection description={t('legalDescription')} title={t('legalTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('legalName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('legalNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registryId')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('registryIdPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>

          <Separator className="my-8" />

          <SettingsSection description={t('signatoryDescription')} title={t('signatoryTitle')}>
            <FormField
              control={form.control}
              name="legalRepresentative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('legalRepresentative')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('legalRepresentativePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SignatureUpload
              name={organization.legalRepresentative ?? organization.name}
              onChanged={onRefresh}
              organizationId={organizationId}
              value={organization.signatureUrl}
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

          <div className="mt-8 flex justify-end">
            <Button
              disabled={disabled || form.formState.isSubmitting}
              loading={form.formState.isSubmitting}
              loadingText={t('saving')}
              type="submit"
            >
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </Form>

      <Separator className="my-8" />

      <SettingsSection description={t('dangerDescription')} title={t('dangerZone')}>
        <ImpersonationLockNote />
        {!platform && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base text-destructive-text">{t('transferTitle')}</CardTitle>
              <CardDescription>{t('transferHelp')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                disabled={impersonating}
                onClick={() => setTransferOpen(true)}
                type="button"
                variant="destructive"
              >
                {t('transferOwnership')}
              </Button>
            </CardContent>
          </Card>
        )}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive-text">{t('deleteOrganizationTitle')}</CardTitle>
            <CardDescription>{t('deleteOrganizationHelp')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled={impersonating} onClick={() => setDeleteOpen(true)} type="button" variant="destructive">
              {t('deleteOrganization')}
            </Button>
          </CardContent>
        </Card>
      </SettingsSection>

      <DeleteOrganizationDialog onConfirm={handleDelete} onOpenChange={setDeleteOpen} open={deleteOpen} />
      {!platform && (
        <TransferOwnershipDialog
          candidates={candidates}
          onOpenChange={setTransferOpen}
          onTransferred={handleTransferred}
          open={transferOpen}
          organizationName={organization.name}
        />
      )}
    </>
  )
}
