'use client'

import { useCallback } from 'react'

import { useLocale, useTranslations } from '@repo/i18n'
import { Markdown } from '@repo/ui/components/markdown'
import { RatingGroup } from '@repo/ui/components/rating-group'

import { type Evaluation } from '@/lib/api'

export const CourseEvaluations = ({
  completed,
  evaluations,
  onEvaluation,
  title,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  completed: boolean
  evaluations: Evaluation[]
  onEvaluation: (id: number, rating: number) => void
  title?: string
}) => {
  const { localize } = useLocale()
  const t = useTranslations('Courses')

  const onValueChange = useCallback(
    (id: number) => {
      if (completed) return
      return (value: string) => {
        onEvaluation(id, Number(value))
      }
    },
    [completed, onEvaluation],
  )

  return (
    <div {...props}>
      {title && <h3 className="mb-2 text-2xl font-semibold text-brand-accent">{title}</h3>}
      <p className="mb-4 font-medium">
        {t('subskillEvaluationsSubtitle', {
          count: evaluations.length,
        })}
      </p>

      <div className="space-y-8">
        {evaluations.map(evaluation => (
          <div className="space-y-4" key={evaluation.id}>
            <Markdown>{localize(evaluation.description)}</Markdown>
            <RatingGroup
              color="brand"
              disabled={completed}
              disabledToast={t('ratingDisabled')}
              id={evaluation.id}
              onValueChange={onValueChange(evaluation.id)}
              value={evaluation.userRating}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
