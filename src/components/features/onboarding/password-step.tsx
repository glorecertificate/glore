'use client'

import Link from 'next/link'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { type OnboardingFormValues } from '@/components/features/onboarding/schema'
import { Checkbox } from '@/components/ui/checkbox'
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
      <FormField
        control={form.control}
        name="termsAccepted"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  className="mt-0.5"
                  disabled={disabled}
                  onBlur={field.onBlur}
                  onCheckedChange={checked => field.onChange(checked === true)}
                />
              </FormControl>
              <FormLabel className="leading-5 font-normal">
                {t.rich('termsAccept', {
                  privacy: chunks => (
                    <Link className="font-medium underline underline-offset-4" href="/privacy" target="_blank">
                      {chunks}
                    </Link>
                  ),
                  terms: chunks => (
                    <Link className="font-medium underline underline-offset-4" href="/terms" target="_blank">
                      {chunks}
                    </Link>
                  ),
                })}
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
