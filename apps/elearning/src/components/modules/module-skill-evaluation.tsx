'use client'

import { useCallback } from 'react'

import { useTranslations } from 'next-intl'
import Markdown from 'react-markdown'

import { type ModuleSkillEvaluation as SkillEvaluation } from '@/api/modules'
import { RatingGroup } from '@/components/ui/rating-group'
import { type Localized } from '@/services/i18n'

export const ModuleSkillEvaluation = ({
  completed,
  evaluation,
  onEvaluation,
  title,
}: {
  completed: boolean
  evaluation: Localized<SkillEvaluation>
  onEvaluation: (rating: number) => void
  title?: string
}) => {
  const t = useTranslations('Modules')

  const onValueChange = useCallback(
    (value: string) => {
      if (completed) return
      onEvaluation(Number(value))
    },
    [completed, onEvaluation],
  )

  return (
    <div className="mt-8 border-t-2 pt-6">
      {title && <h3 className="mb-2 text-2xl font-semibold text-secondary-accent">{title}</h3>}
      <p className="mb-4 font-medium">
        {t('subskillEvaluationsSubtitle', {
          count: 1,
        })}
      </p>

      <div className="space-y-8">
        <div className="space-y-4" key={evaluation.id}>
          <Markdown>{evaluation.description}</Markdown>
          <RatingGroup
            color="secondary"
            disabled={completed}
            disabledToast={t('ratingDisabled')}
            id={evaluation.id}
            onValueChange={onValueChange}
            value={evaluation.user_evaluation}
          />
        </div>
      </div>
    </div>
  )
}
