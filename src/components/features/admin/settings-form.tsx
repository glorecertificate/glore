'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { saveSettings } from '@/actions/admin/settings'
import { Button } from '@/components/ui/button'
import { CountrySelect } from '@/components/ui/country-select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { useFormDisabled } from '@/hooks/use-form-disabled'
import {
  type AppSettings,
  type AppSettingsInput,
  DEFAULT_SETTINGS,
  SOCIAL_LABELS,
  SOCIAL_PLATFORMS,
  createSettingsSchema,
} from '@/lib/app-settings'

import { AdminSettingsSection } from './admin-settings-section'
import { SettingsField } from './settings-field'
import { useAdminError } from './use-admin-error'

export const AdminSettingsForm = ({ settings }: { settings: AppSettings }) => {
  const t = useTranslations('Admin.settings')
  const adminError = useAdminError()

  const form = useForm<AppSettingsInput>({
    defaultValues: settings,
    resolver: zodResolver(
      createSettingsSchema({
        email: t('invalidEmail'),
        phone: t('invalidPhone'),
        required: t('required'),
        url: t('invalidUrl'),
      })
    ),
  })
  const disabled = useFormDisabled(form.control)

  const handleSubmit = async (values: AppSettingsInput) => {
    const { data, error } = await saveSettings(values)
    if (error || !data) {
      toast.error(adminError(error?.code))
      return
    }

    form.reset(data.settings)
    toast.success(t('saved'))
  }

  const handleRestore = () => form.reset(DEFAULT_SETTINGS, { keepDefaultValues: true })

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <AdminSettingsSection description={t('contactDescription')} title={t('contactTitle')}>
          <SettingsField
            control={form.control}
            label={t('email')}
            name="email"
            placeholder={t('emailPlaceholder')}
            type="email"
          />
          <SettingsField
            control={form.control}
            description={t('phoneHelp')}
            label={t('phone')}
            name="phone"
            placeholder={t('phonePlaceholder')}
            type="tel"
          />
          <SettingsField
            className="sm:col-span-2"
            control={form.control}
            label={t('website')}
            name="website"
            placeholder={t('websitePlaceholder')}
            type="url"
          />
        </AdminSettingsSection>

        <AdminSettingsSection description={t('socialDescription')} title={t('socialTitle')}>
          {SOCIAL_PLATFORMS.map(platform => (
            <SettingsField
              control={form.control}
              key={platform}
              label={SOCIAL_LABELS[platform]}
              name={`social.${platform}`}
              placeholder={t('socialPlaceholder')}
              type="url"
            />
          ))}
        </AdminSettingsSection>

        <AdminSettingsSection description={t('entityDescription')} title={t('entityTitle')}>
          <SettingsField
            className="sm:col-span-2"
            control={form.control}
            label={t('entityName')}
            name="legalEntity.name"
          />
          <SettingsField
            className="sm:col-span-2"
            control={form.control}
            label={t('entityAddress')}
            name="legalEntity.address"
          />
          <FormField
            control={form.control}
            name="legalEntity.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('entityCountry')}</FormLabel>
                <FormControl>
                  <CountrySelect disabled={form.formState.isSubmitting} onChange={field.onChange} value={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </AdminSettingsSection>

        <div className="sticky bottom-0 -mx-page flex flex-wrap items-center justify-end gap-3 border-t bg-background/95 px-page py-3 backdrop-blur-sm">
          <output aria-live="polite" className="mr-auto text-sm text-muted-foreground max-sm:sr-only">
            {form.formState.isDirty ? t('unsaved') : t('upToDate')}
          </output>
          <Button
            disabled={form.formState.isSubmitting}
            className="max-sm:flex-1"
            onClick={handleRestore}
            type="button"
            variant="outline"
          >
            {t('restore')}
          </Button>
          <Button
            className="max-sm:flex-1"
            disabled={disabled || form.formState.isSubmitting}
            loading={form.formState.isSubmitting}
            loadingText={t('saving')}
            type="submit"
          >
            {t('save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
