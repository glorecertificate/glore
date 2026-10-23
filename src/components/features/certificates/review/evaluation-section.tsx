'use client'

import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
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
    <section className="flex flex-col gap-4" aria-labelledby="evaluation-title">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold" id="evaluation-title">
          {t('evaluationTitle')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('evaluationDescription')}</p>
      </div>
      <Banner>
        <LucideIcon name="eye-off" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p>{t('blindNote')}</p>
      </Banner>
      {SCORES.map(score => (
        <FormField
          control={control}
          key={score}
          name={`scores.${score}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels[score]}</FormLabel>
              <p className="text-xs text-muted-foreground">{hints[score]}</p>
              <FormControl>
                <RatingGroup
                  className="max-w-sm"
                  color="brand"
                  id={`score-${score}`}
                  onValueChange={value => field.onChange(Number(value))}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FieldError />
            </FormItem>
          )}
        />
      ))}
    </section>
  )
}
