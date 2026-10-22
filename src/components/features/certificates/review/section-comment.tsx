'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

export const SectionComment = ({ section }: { section: keyof ReviewFormValues['sectionComments'] }) => {
  const t = useTranslations('Certificates.review')
  const { control } = useFormContext<ReviewFormValues>()

  return (
    <FormField
      control={control}
      name={`sectionComments.${section}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-muted-foreground">{t('sectionComment')}</FormLabel>
          <FormControl>
            <Textarea className="min-h-16" placeholder={t('sectionCommentPlaceholder')} {...field} />
          </FormControl>
          <FieldError />
        </FormItem>
      )}
    />
  )
}
