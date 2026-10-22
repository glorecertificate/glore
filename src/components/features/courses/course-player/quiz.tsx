'use client'

import { useTranslations } from 'next-intl'

import { type useLessonProgress } from '@/components/features/courses/course-player/use-lesson-progress'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { type LearnerLesson } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const LessonQuiz = ({
  className,
  lesson,
  progress,
  ...props
}: React.ComponentProps<'section'> & {
  lesson: LearnerLesson
  progress: ReturnType<typeof useLessonProgress>
}) => {
  const t = useTranslations('Learning.player')
  const { check, checking, failed, questions, select } = progress

  if (lesson.questions.length === 0) return null

  return (
    <section className={cn('flex flex-col gap-6 border-t pt-6', className)} {...props}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t('quizTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('quizHint', { count: lesson.questions.length })}</p>
      </div>
      {lesson.questions.map((question, index) => {
        const state = questions[question.id]
        if (!state) return null
        const groupId = `question-${question.id}`

        return (
          <fieldset className="flex flex-col gap-3" key={question.id}>
            <legend className="mb-3 font-medium" id={`${groupId}-label`}>
              {`${index + 1}. ${question.text}`}
            </legend>
            <RadioGroup
              aria-labelledby={`${groupId}-label`}
              disabled={state.solved}
              onValueChange={value => select(question.id, Number(value))}
              value={state.selected === null ? '' : String(state.selected)}
            >
              {question.options.map(option => {
                const tried = state.attempted.includes(option.id) && option.id !== state.correctOptionId
                const right = state.solved && option.id === state.correctOptionId
                return (
                  <Label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-snug font-normal transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5',
                      right && 'border-success bg-success/10',
                      tried && 'cursor-not-allowed text-muted-foreground line-through opacity-70',
                      state.solved && !right && 'cursor-default opacity-70'
                    )}
                    htmlFor={`${groupId}-${option.id}`}
                    key={option.id}
                  >
                    <RadioGroupItem
                      className="mt-0.5"
                      disabled={state.solved || tried}
                      id={`${groupId}-${option.id}`}
                      value={String(option.id)}
                    />
                    <span className="grow">{option.text}</span>
                    {right && <LucideIcon className="size-4 shrink-0 text-success" name="circle-check" />}
                  </Label>
                )
              })}
            </RadioGroup>
            {!state.solved && (
              <div>
                <Button
                  disabled={state.selected === null}
                  loading={checking === question.id}
                  onClick={() => check(question.id)}
                  size="sm"
                  variant="outline"
                >
                  {t('check')}
                </Button>
              </div>
            )}
            {state.feedback && (
              <Banner variant={state.feedback === 'correct' ? 'success' : 'warning'}>
                <LucideIcon
                  className="mt-0.5 size-4 shrink-0"
                  name={state.feedback === 'correct' ? 'circle-check' : 'rotate-ccw'}
                />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{state.feedback === 'correct' ? t('correct') : t('wrong')}</p>
                  {state.explanation && <p className="text-muted-foreground">{state.explanation}</p>}
                </div>
              </Banner>
            )}
          </fieldset>
        )
      })}
      {failed && (
        <Banner role="alert" variant="destructive">
          {t('checkError')}
        </Banner>
      )}
    </section>
  )
}
