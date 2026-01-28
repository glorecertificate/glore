'use client'

import { useCallback } from 'react'

import { useTranslations } from 'next-intl'

import { Markdown } from '@/components/ui/markdown'
import { RatingGroup } from '@/components/ui/rating-group'
import { type Assessment } from '@/db/queries/lesson'
import { useI18n } from '@/hooks/use-i18n'

export const CourseAssessment = ({
  assessment,
  className,
  completed,
  onValueChange,
  title,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  assessment: Exclude<Assessment, null>
  completed: boolean
  onValueChange: (rating: number) => void
  title?: string
}) => {
  const t = useTranslations('Courses')
  const { localize } = useI18n()

  const description = assessment.description ? localize(assessment.description) : ''
  const rating = assessment.user_assessments?.[0]?.value || 0

  const onChange = useCallback(
    (value: string) => {
      if (!completed) {
        onValueChange(Number(value))
      }
    },
    [completed, onValueChange]
  )

  return (
    <div {...props}>
      {title && <h3 className="mb-2 font-semibold text-2xl text-brand-accent">{title}</h3>}
      <p className="mb-4 font-medium">
        {t('subskillEvaluationsSubtitle', {
          count: 1,
        })}
      </p>
      <div className="space-y-8">
        <div className="space-y-4">
          <Markdown>{description}</Markdown>
          <RatingGroup
            color="brand"
            disabled={completed}
            disabledToast={t('ratingDisabled')}
            id={assessment.id}
            onValueChange={onChange}
            value={rating}
          />
        </div>
      </div>
    </div>
  )
}
