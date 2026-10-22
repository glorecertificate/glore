'use client'

import { type Locale, useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { type OnboardingFormValues } from '@/components/features/onboarding/schema'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LanguageSelect } from '@/components/ui/language-select'
import { PhoneInput } from '@/components/ui/phone-input'

const DEFAULT_COUNTRIES: Record<Locale, string> = { en: 'gb', es: 'es', it: 'it' }

export const ContactStep = ({ disabled, locale }: { disabled: boolean; locale: Locale }) => {
  const t = useTranslations('Onboarding')
  const form = useFormContext<OnboardingFormValues>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('phoneLabel')}</FormLabel>
            <FormControl>
              <PhoneInput
                defaultCountry={DEFAULT_COUNTRIES[locale]}
                disabled={disabled}
                onChange={field.onChange}
                placeholder={t('phonePlaceholder')}
                value={field.value}
              />
            </FormControl>
            <FormDescription>{t('phoneDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="preferredLanguage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('preferredLanguageLabel')}</FormLabel>
            <FormControl>
              <LanguageSelect disabled={disabled} onChange={field.onChange} />
            </FormControl>
            <FormDescription>{t('preferredLanguageDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
