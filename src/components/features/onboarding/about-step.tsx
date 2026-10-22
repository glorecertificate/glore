'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { BirthdayField } from '@/components/features/onboarding/birthday-field'
import { type OnboardingFormValues } from '@/components/features/onboarding/schema'
import { CountrySelect } from '@/components/ui/country-select'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export const AboutStep = ({ disabled }: { disabled: boolean }) => {
  const t = useTranslations('Onboarding')
  const form = useFormContext<OnboardingFormValues>()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <BirthdayField disabled={disabled} />
        <FormField
          control={form.control}
          name="birthPlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('birthPlaceLabel')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  autoFocus
                  disabled={disabled}
                  placeholder={t('birthPlacePlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="nationality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('nationalityLabel')}</FormLabel>
            <FormControl>
              <CountrySelect disabled={disabled} onChange={field.onChange} value={field.value} />
            </FormControl>
            <FormDescription>{t('certificateNote')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
