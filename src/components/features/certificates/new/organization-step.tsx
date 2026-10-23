'use client'

import { useTranslations } from 'next-intl'
import { useFormContext, useWatch } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { MAX_RATING_COMMENT_LENGTH, type WizardValues } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { RatingGroup } from '@/components/ui/rating-group'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Textarea } from '@/components/ui/textarea'

const CommentLength = () => {
  const { control } = useFormContext<WizardValues>()
  const text = useWatch({ control, name: 'rating.comment' })
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {(text ?? '').length}
      {'/'}
      {MAX_RATING_COMMENT_LENGTH}
    </span>
  )
}

const SCORES = ['experience', 'support', 'certificationSupport'] as const

export const OrganizationStep = ({ organization }: { organization: string }) => {
  const t = useTranslations('Certificates.wizard')
  const { control } = useFormContext<WizardValues>()
  const labels = {
    certificationSupport: t('ratingCertificationSupport'),
    experience: t('ratingExperience', { organization }),
    support: t('ratingSupport'),
  }

  return (
    <div className="flex flex-col gap-5">
      <Banner>
        <LucideIcon name="shield-check" className="mt-0.5 size-4 shrink-0 text-brand-text" />
        <p>{t('anonymousNote', { organization })}</p>
      </Banner>
      {SCORES.map(score => (
        <FormField
          control={control}
          key={score}
          name={`rating.${score}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels[score]}</FormLabel>
              <FormControl>
                <RatingGroup
                  className="max-w-sm"
                  color="brand"
                  id={`rating-${score}`}
                  onValueChange={value => field.onChange(Number(value))}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FieldError />
            </FormItem>
          )}
        />
      ))}
      <FormField
        control={control}
        name="rating.wouldRecommend"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('ratingWouldRecommend', { organization })}</FormLabel>
            <SegmentedControl
              aria-label={t('ratingWouldRecommend', { organization })}
              onValueChange={value => field.onChange(value === 'yes')}
              value={field.value === undefined || field.value === null ? '' : field.value ? 'yes' : 'no'}
            >
              <SegmentedControlItem value="yes">{t('yes')}</SegmentedControlItem>
              <SegmentedControlItem value="no">{t('no')}</SegmentedControlItem>
            </SegmentedControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="rating.comment"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between gap-2">
              <FormLabel>{t('ratingComment')}</FormLabel>
              <CommentLength />
            </div>
            <FormControl>
              <Textarea
                className="min-h-24"
                placeholder={t('ratingCommentPlaceholder')}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FieldError />
          </FormItem>
        )}
      />
    </div>
  )
}
