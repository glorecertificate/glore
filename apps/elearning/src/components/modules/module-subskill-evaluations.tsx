'use client'

import { useTranslations } from 'next-intl'
import Markdown from 'react-markdown'

import { type ModuleSubskillEvaluation } from '@/api/modules'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { type Localized } from '@/services/i18n'

export const ModuleSubskillEvaluations = ({ evaluations }: { evaluations: Localized<ModuleSubskillEvaluation[]> }) => {
  const t = useTranslations('Modules')

  return (
    <div className="mt-8 border-t-2 pt-6">
      {/* <h3 className="mb-2 text-2xl font-semibold text-secondary-accent">{t('subskillEvaluationsTitle')}</h3> */}
      <p className="mb-4 font-medium">
        {t('subskillEvaluationsSubtitle', {
          count: evaluations.length,
        })}
      </p>

      <div className="space-y-8">
        {evaluations.map(evaluation => (
          <div className="space-y-4" key={evaluation.id}>
            <Markdown>{evaluation.description}</Markdown>

            <RadioGroup
              className="flex justify-between"
              // onValueChange={value => onAnswer(question.id, Number.parseInt(value))}
              // value={userAnswers[question.id]?.toString()}
            >
              {[1, 2, 3, 4, 5].map(rating => (
                <div className="flex flex-col items-center gap-2" key={rating}>
                  <RadioGroupItem className="peer sr-only" id={`${evaluation.id}-${rating}`} value={rating.toString()} />
                  <Label
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border peer-data-[state=checked]:bg-muted hover:bg-muted"
                    htmlFor={`${evaluation.id}-${rating}`}
                  >
                    {rating}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {t('selfAssestmentRating', {
                      rating: String(rating),
                    })}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>
    </div>
  )
}
