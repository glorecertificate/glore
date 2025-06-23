'use client'

import { useCallback, useMemo } from 'react'

import { type Course, type Lesson } from '@/api/modules/courses/types'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

export const CourseSidebar = ({
  course,
  editable,
  infoVisible,
  lesson,
  onStepChange,
  setStep,
  showInfo: _showInfo,
  step,
}: {
  course: Course | Partial<Course>
  editable?: boolean
  infoVisible?: boolean
  lesson?: Lesson | Partial<Lesson>
  onStepChange?: (index: number) => void
  setStep: (step: number) => void
  showInfo?: () => void
  step?: number
}) => {
  const { localize } = useLocale()
  const t = useTranslations('Courses')

  const hasSteps = useMemo(() => course.lessons && course.lessons.length > 0, [course.lessons])
  const isLastStep = useMemo(() => step === (course.lessonsCount ?? 0) - 1, [course.lessonsCount, step])

  const isCurrent = useCallback((index: number) => step !== undefined && index === step, [step])
  const isPast = useCallback((index: number) => step !== undefined && index < step, [step])
  const isFuture = useCallback((index: number) => step !== undefined && index > step, [step])
  const isCompleted = useCallback((index: number) => !!course.lessons?.[index].completed, [course.lessons])
  const showCompleted = useCallback((index: number) => !editable && isCompleted(index), [editable, isCompleted])
  const isReachable = useCallback(
    (index: number) => editable || isCurrent(index) || isPast(index) || (isFuture(index) && isCompleted(index)),
    [editable, isCurrent, isPast, isFuture, isCompleted],
  )
  const formatTitle = useCallback(
    (index: number) => {
      if (!isReachable(index)) return t('completeLessonsToProceed')
    },
    [isReachable, t],
  )
  const formatLessonType = useCallback(
    (type: string) =>
      t('lessonType', {
        type,
      }),
    [t],
  )

  const handleNextStep = useCallback(() => {
    if (step === undefined) return
    if (editable && !isLastStep) return setStep(step + 1)
    if (onStepChange) onStepChange(step + 1)
  }, [editable, isLastStep, onStepChange, step, setStep])

  const onStepClick = useCallback(
    (index: number) => {
      if (step === undefined) return
      if (index > step && !lesson?.completed) return
      if (index === step) return handleNextStep()
      setStep(index)
    },
    [step, lesson?.completed, setStep, handleNextStep],
  )

  return (
    <div className="mr-2 hidden max-w-lg min-w-52 flex-1/4 shrink-0 md:block md:max-lg:flex-1/3">
      {infoVisible && <Button>{t('info')}</Button>}
      {hasSteps && step !== undefined && (
        <div className="sticky top-[72px] flex items-center gap-2">
          <span className="pt-1 text-sm text-muted-foreground">
            {t('lessonCount', {
              count: String(step + 1),
              total: String(course.lessons?.length || 0),
            })}
          </span>
        </div>
      )}
      <div className="sticky top-[120px] space-y-2 pr-2">
        {hasSteps && (
          <div className="relative">
            <div className="absolute top-[60px] left-[23px] w-0.5 bg-muted" />
            <div
              className="absolute top-[50px] left-[23px] w-0.5 bg-secondary transition-all duration-300"
              style={{ height: `${course.progress}%` }}
            />
            {course.lessons?.map((lesson, index) => (
              <div
                className={cn(
                  'relative mb-4 flex cursor-pointer items-center rounded-md p-3 pl-12 dark:bg-transparent',
                  isCurrent(index) && 'pointer-events-none bg-accent/50',
                  isReachable(index) && 'hover:bg-accent/50',
                  !isReachable(index) && 'cursor-not-allowed text-muted-foreground',
                )}
                key={lesson.id}
                onClick={onStepClick.bind(null, index)}
                title={formatTitle(index)}
              >
                <div
                  className={cn(
                    'absolute top-1/2 left-6 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border',
                    isCurrent(index) || isPast(index)
                      ? 'border-secondary-accent bg-secondary text-secondary-foreground'
                      : 'border-border bg-background',
                  )}
                >
                  <span className="text-xs">{index + 1}</span>
                </div>
                <div className={cn('flex-1 opacity-85', isCurrent(index) && 'opacity-100')}>
                  <span className="inline-block text-sm font-medium">
                    {localize(lesson.title)}{' '}
                    {showCompleted(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                  </span>
                  <p className="text-xs opacity-80">{formatLessonType(lesson.type)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
