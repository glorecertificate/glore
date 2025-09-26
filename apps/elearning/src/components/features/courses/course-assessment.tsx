'use client'

import { useCallback, useMemo } from 'react'

import { useLocale, useTranslations } from '@repo/i18n'
import { Markdown } from '@repo/ui/components/markdown'
import { RatingGroup } from '@repo/ui/components/rating-group'

import { type Assessment } from '@/lib/api'

export const CourseAssessment = ({
  assessment,
  className,
  completed,
  onValueChange,
  title,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  completed: boolean
  assessment: Assessment
  onValueChange: (rating: number) => void
  title?: string
}) => {
  const { localize } = useLocale()
  const t = useTranslations('Courses')

  const description = useMemo(() => localize(assessment.description), [assessment.description, localize])

  const onChange = useCallback(
    (value: string) => {
      if (completed) return
      onValueChange(Number(value))
    },
    [completed, onValueChange],
  )

  return (
    <div {...props}>
      {title && <h3 className="mb-2 text-2xl font-semibold text-brand-accent">{title}</h3>}
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
            value={assessment.userRating}
          />
        </div>
      </div>
    </div>
  )
}
