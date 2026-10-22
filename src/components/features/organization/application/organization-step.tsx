'use client'

import { useTranslations } from 'next-intl'

import { CountrySelect } from '@/components/ui/country-select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { ApplicationField } from './application-field'
import { type ApplicationForm } from './types'

export const OrganizationStep = ({ form }: { form: ApplicationForm }) => {
  const t = useTranslations('Register')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ApplicationField
        autoComplete="organization"
        className="sm:col-span-2"
        form={form}
        label={t('name')}
        name="name"
        placeholder={t('namePlaceholder')}
      />
      <ApplicationField form={form} label={t('legalName')} name="legalName" placeholder={t('legalNamePlaceholder')} />
      <ApplicationField
        form={form}
        help={t('registryIdHelp')}
        label={t('registryId')}
        name="registryId"
        placeholder={t('registryIdPlaceholder')}
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
      <ApplicationField
        autoComplete="address-level2"
        form={form}
        label={t('city')}
        name="city"
        placeholder={t('cityPlaceholder')}
      />
      <ApplicationField
        autoComplete="email"
        form={form}
        inputMode="email"
        label={t('orgEmail')}
        name="email"
        placeholder={t('orgEmailPlaceholder')}
        type="email"
      />
      <ApplicationField
        form={form}
        inputMode="url"
        label={t('url')}
        name="url"
        optional
        placeholder={t('urlPlaceholder')}
        type="url"
      />
      <ApplicationField
        form={form}
        help={t('volunteersPerYearHelp')}
        inputMode="numeric"
        label={t('volunteersPerYear')}
        name="volunteersPerYear"
        placeholder={t('volunteersPerYearPlaceholder')}
      />
    </div>
  )
}
