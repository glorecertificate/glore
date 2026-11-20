'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const SECTION_LABELS = {
  experience: 'sectionExperience',
  personal: 'sectionPersonal',
  skills: 'sectionSkills',
  tasks: 'sectionTasks',
} as const

export const SectionComment = ({ section }: { section: keyof ReviewFormValues['sectionComments'] }) => {
  const t = useTranslations('CertificateReview')
  const { control } = useFormContext<ReviewFormValues>()

  return (
    <FormField
      control={control}
      name={`sectionComments.${section}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(SECTION_LABELS[section])}</FormLabel>
          <FormControl>
            <Textarea className="min-h-24" placeholder={t('sectionCommentPlaceholder')} {...field} />
          </FormControl>
          <FieldError />
        </FormItem>
      )}
    />
  )
}
