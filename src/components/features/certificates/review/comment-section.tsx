'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { SectionComment } from '@/components/features/certificates/review/section-comment'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const SECTIONS = ['experience', 'tasks', 'skills', 'personal'] as const

export const CommentSection = () => {
  const t = useTranslations('CertificateReview')
  const { clearErrors, control } = useFormContext<ReviewFormValues>()

  return (
    <section aria-labelledby="comment-title" className="flex min-w-0 flex-col gap-5">
      <h2 className="type-heading text-fg-title" id="comment-title">
        {t('commentTitle')}
      </h2>
      <FormField
        control={control}
        name="comment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('comment')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-32"
                onChange={event => {
                  field.onChange(event)
                  clearErrors('comment')
                }}
                placeholder={t('commentPlaceholder')}
              />
            </FormControl>
            <FieldError />
          </FormItem>
        )}
      />
      <Collapsible className="group/notes flex flex-col gap-4">
        <CollapsibleTrigger asChild>
          <Button className="self-start text-action-text" size="text" type="button" variant="link">
            <LucideIcon
              className="size-3.5 transition-transform group-data-[state=open]/notes:rotate-90"
              name="chevron-right"
            />
            {t('notesTitle')}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-5">
          {SECTIONS.map(section => (
            <SectionComment key={section} section={section} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
