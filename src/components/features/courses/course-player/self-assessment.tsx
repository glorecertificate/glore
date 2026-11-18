'use client'

import { useTranslations } from 'next-intl'

import { DescriptionChoice } from '@/components/features/courses/course-player/description-choice'
import { type useLessonProgress } from '@/components/features/courses/course-player/use-lesson-progress'
import { Banner } from '@/components/ui/banner'
import { Label } from '@/components/ui/label'
import { MarkdownLazy } from '@/components/ui/markdown-lazy'
import { RatingGroup } from '@/components/ui/rating-group'
import { Textarea } from '@/components/ui/textarea'
import { type LearnerLesson, REFLECTION_MAX_LENGTH, REFLECTION_MIN_LENGTH } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const LessonSelfAssessment = ({
  className,
  disabled,
  lesson,
  progress,
  ...props
}: React.ComponentProps<'section'> & {
  disabled: boolean
  lesson: LearnerLesson
  progress: ReturnType<typeof useLessonProgress>
}) => {
  const t = useTranslations('Learning.player')
  const { assessmentChoice, rate, ratings, reflection, reflectionLength, setAssessmentChoice, setReflection } = progress
  const { assessment, evaluations } = lesson

  if (evaluations.length === 0 && !assessment) return null

  return (
    <section className={cn('flex flex-col gap-8 border-t pt-6', className)} {...props}>
      {evaluations.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{t('evaluationsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('evaluationsHint')}</p>
          </div>
          {evaluations.map(evaluation => (
            <div className="flex flex-col gap-3" key={evaluation.id}>
              <MarkdownLazy>{evaluation.text}</MarkdownLazy>
              <RatingGroup
                color="brand"
                disabled={disabled}
                id={`evaluation-${evaluation.id}`}
                onValueChange={value => rate(evaluation.id, Number(value))}
                value={ratings[evaluation.id]}
              />
            </div>
          ))}
        </div>
      )}
      {assessment && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{t('assessmentTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('assessmentHint')}</p>
          </div>
          {assessment.choices ? (
            <DescriptionChoice
              aria-label={t('assessmentTitle')}
              disabled={disabled}
              id={`assessment-${assessment.id}`}
              onValueChange={setAssessmentChoice}
              options={assessment.choices}
              value={assessmentChoice}
            />
          ) : (
            <Banner variant="warning">
              <p>{t('descriptionsMissing')}</p>
            </Banner>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor={`reflection-${assessment.id}`}>{t('reflectionLabel')}</Label>
            <Textarea
              aria-describedby={`reflection-${assessment.id}-hint`}
              className="min-h-32"
              disabled={disabled}
              id={`reflection-${assessment.id}`}
              maxLength={REFLECTION_MAX_LENGTH}
              onChange={event => setReflection(event.target.value)}
              placeholder={t('reflectionPlaceholder')}
              value={reflection}
            />
            <p className="text-xs text-muted-foreground" id={`reflection-${assessment.id}-hint`}>
              {t('reflectionCount', {
                count: reflectionLength,
                max: REFLECTION_MAX_LENGTH,
                min: REFLECTION_MIN_LENGTH,
              })}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
