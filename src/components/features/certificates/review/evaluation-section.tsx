'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { RatingGroup } from '@/components/ui/rating-group'

const SCORES = ['engagement', 'evidence', 'reflection', 'growth'] as const

export const EvaluationSection = () => {
  const t = useTranslations('CertificateReview')
  const { control } = useFormContext<ReviewFormValues>()
  const labels = {
    engagement: t('scoreEngagement'),
    evidence: t('scoreEvidence'),
    growth: t('scoreGrowth'),
    reflection: t('scoreReflection'),
  }
  const hints = {
    engagement: t('scoreEngagementHint'),
    evidence: t('scoreEvidenceHint'),
    growth: t('scoreGrowthHint'),
    reflection: t('scoreReflectionHint'),
  }

  return (
    <section aria-labelledby="evaluation-title" className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="type-heading text-fg-title" id="evaluation-title">
          {t('evaluationTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('evaluationDescription')}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <LucideIcon className="size-3.5 shrink-0" name="eye-off" />
          {t('blindNote')}
        </p>
      </div>
      <div className="flex flex-col">
        {SCORES.map(score => (
          <FormField
            control={control}
            key={score}
            name={`scores.${score}`}
            render={({ field }) => (
              <FormItem className="gap-x-6 gap-y-2 border-t border-border-subtle py-4 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex min-w-0 flex-col gap-1">
                  <FormLabel className="text-[0.9375rem] font-semibold">{labels[score]}</FormLabel>
                  <p className="text-xs text-muted-foreground">{hints[score]}</p>
                </div>
                <FormControl>
                  <RatingGroup
                    className="w-full max-w-64 gap-1 sm:w-64"
                    color="brand"
                    id={`score-${score}`}
                    onValueChange={value => field.onChange(Number(value))}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FieldError className="sm:col-span-2" />
              </FormItem>
            )}
          />
        ))}
      </div>
    </section>
  )
}
