'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveSettings } from '@/actions/admin/settings'
import { SettingsSection } from '@/components/features/organization/settings-section'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { useFormDisabled } from '@/hooks/use-form-disabled'
import {
  type AppSettings,
  type AppSettingsInput,
  DEFAULT_SETTINGS,
  SOCIAL_LABELS,
  SOCIAL_PLATFORMS,
  createSettingsSchema,
} from '@/lib/app-settings'

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
      <form className="max-w-4xl" onSubmit={form.handleSubmit(handleSubmit)}>
        <SettingsSection description={t('contactDescription')} title={t('contactTitle')}>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('socialDescription')} title={t('socialTitle')}>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </SettingsSection>

        <Separator className="my-8" />

        <SettingsSection description={t('entityDescription')} title={t('entityTitle')}>
          <div className="grid gap-4">
            <SettingsField control={form.control} label={t('entityName')} name="legalEntity.name" />
            <SettingsField control={form.control} label={t('entityAddress')} name="legalEntity.address" />
          </div>
        </SettingsSection>

        <div className="mt-8 flex justify-end gap-2">
          <Button disabled={form.formState.isSubmitting} onClick={handleRestore} type="button" variant="outline">
            {t('restore')}
          </Button>
          <Button
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
