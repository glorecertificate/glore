'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import {
  deleteOrganization,
  removeOrganizationAvatar,
  updateOrganization,
  uploadOrganizationAvatar,
} from '@/actions/organizations/settings'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CountrySelect } from '@/components/ui/country-select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { type User } from '@/db/queries/user'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { defaultFormDisabled } from '@/lib/utils'

import { organizationSettingsSchema } from './schemas'

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

  const handleConfirm = async () => {
    try {
      setDeleting(true)
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

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

interface OrganizationSettingsProps {
  onRefresh: () => void
  onSyncUser: (user: User) => void
  organization: OrganizationPanelData['organization']
}

export const OrganizationSettings = ({ onRefresh, onSyncUser, organization }: OrganizationSettingsProps) => {
  const { push } = useRouter()
  const { organization: sessionOrg } = useSession()
  const { localize } = useI18n()
  const t = useTranslations('Organization')

  const [deleteOrganizationOpen, setDeleteOrganizationOpen] = useState(false)

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

  useEffect(() => {
    form.reset({
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
    })
  }, [form, localize, organization])

  const handleSettingsSubmit = async (values: z.infer<typeof organizationSettingsSchema>) => {
    const { data: result, error } = await updateOrganization(values)

    if (error || !result) {
      toast.error(error?.message ?? t('settingsUpdateError'))
      return
    }

    onSyncUser(result.user)
    toast.success(t('settingsUpdated'))
    onRefresh()
  }

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const { data: result, error } = await uploadOrganizationAvatar(formData)

    if (error || !result) {
      toast.error(error?.message ?? t('avatarUploadError'))
      return
    }

    onSyncUser(result.user)
    toast.success(t('avatarUploaded'))
    onRefresh()
  }

  const handleAvatarRemove = async () => {
    const { data: result, error } = await removeOrganizationAvatar()

    if (error || !result) {
      toast.error(error?.message ?? t('avatarRemoveError'))
      return
    }

    onSyncUser(result.user)
    toast.success(t('avatarRemoved'))
    onRefresh()
  }

  const handleDeleteOrganization = async () => {
    const { data: result, error } = await deleteOrganization()

    if (error || !result) {
      toast.error(error?.message ?? t('deleteOrganizationError'))
      return
    }

    onSyncUser(result.user)
    setDeleteOrganizationOpen(false)
    toast.success(t('organizationDeleted'))
    push('/dashboard')
    onRefresh()
  }

  const settingsDisabled = defaultFormDisabled(form)

  return (
    <>
      <Form {...form}>
        <form className="space-y-0" onSubmit={form.handleSubmit(handleSettingsSubmit)}>
          <SettingsSection description={t('brandingDescription')} title={t('branding')}>
            <ImageCropper
              fallback={sessionOrg?.name?.slice(0, 2).toUpperCase() ?? organization.name.slice(0, 2).toUpperCase()}
              onChange={handleAvatarUpload}
              onRemove={handleAvatarRemove}
              value={sessionOrg?.avatarUrl ?? organization.avatarUrl}
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
