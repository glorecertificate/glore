'use client'

import { useTranslations } from 'next-intl'

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { APPLICATION_MOTIVATION_MIN } from '@/db/queries/organization-application'

import { type ApplicationForm } from './types'

export const MotivationStep = ({ form }: { form: ApplicationForm }) => {
  const t = useTranslations('Register')

  return (
    <FormField
      control={form.control}
      name="motivation"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('motivation')}</FormLabel>
          <FormControl>
            <Textarea placeholder={t('motivationPlaceholder')} rows={8} {...field} />
          </FormControl>
          <FormDescription>{t('motivationHelp', { min: APPLICATION_MOTIVATION_MIN })}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
