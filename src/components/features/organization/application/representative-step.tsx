'use client'

import { useTranslations } from 'next-intl'

import { Separator } from '@/components/ui/separator'

import { ApplicationField } from './application-field'
import { type ApplicationForm } from './types'

export const RepresentativeStep = ({ form }: { form: ApplicationForm }) => {
  const t = useTranslations('Register')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ApplicationField
          autoComplete="given-name"
          form={form}
          label={t('firstName')}
          name="firstName"
          placeholder={t('firstNamePlaceholder')}
        />
        <ApplicationField
          autoComplete="family-name"
          form={form}
          label={t('lastName')}
          name="lastName"
          placeholder={t('lastNamePlaceholder')}
        />
        <ApplicationField
          autoComplete="email"
          className="sm:col-span-2"
          form={form}
          help={t('emailHelp')}
          inputMode="email"
          label={t('email')}
          name="registrantEmail"
          placeholder={t('emailPlaceholder')}
          type="email"
        />
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-medium">{t('contactTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('contactDescription')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ApplicationField
            form={form}
            label={t('contactName')}
            name="contactName"
            optional
            placeholder={t('contactNamePlaceholder')}
          />
          <ApplicationField
            form={form}
            inputMode="email"
            label={t('contactEmail')}
            name="contactEmail"
            optional
            placeholder={t('contactEmailPlaceholder')}
            type="email"
          />
        </div>
      </div>
    </div>
  )
}
