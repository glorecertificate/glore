'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { type OnboardingFormValues } from '@/components/features/onboarding/schema'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export const NameStep = ({ disabled }: { disabled: boolean }) => {
  const t = useTranslations('Onboarding')
  const form = useFormContext<OnboardingFormValues>()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('firstNameLabel')}</FormLabel>
            <FormControl>
              <Input
                autoComplete="given-name"
                autoFocus
                disabled={disabled}
                placeholder={t('firstNamePlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('lastNameLabel')}</FormLabel>
            <FormControl>
              <Input autoComplete="family-name" disabled={disabled} placeholder={t('lastNamePlaceholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
