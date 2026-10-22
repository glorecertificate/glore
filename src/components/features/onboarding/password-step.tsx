'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { type OnboardingFormValues } from '@/components/features/onboarding/schema'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'

export const PasswordStep = ({ disabled }: { disabled: boolean }) => {
  const t = useTranslations('Onboarding')
  const form = useFormContext<OnboardingFormValues>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('passwordLabel')}</FormLabel>
            <FormControl>
              <PasswordInput
                autoComplete="new-password"
                autoFocus
                disabled={disabled}
                placeholder={t('passwordPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormDescription>{t('passwordRequirements')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
            <FormControl>
              <PasswordInput
                autoComplete="new-password"
                disabled={disabled}
                placeholder={t('confirmPasswordPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
