'use client'

import { useCallback, useMemo } from 'react'

import { EditIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ArcherContainer, ArcherElement } from 'react-archer'
import { type RelationType } from 'react-archer/lib/types'

import { InformationIcon } from '@/components/icons/information'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCourse } from '@/hooks/use-course'
import { useIntl } from '@/hooks/use-intl'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord } from '@/lib/intl'
import { cn } from '@/lib/utils'

export const CourseSidebar = () => {
  const { course, infoVisible, language, mode, setInfoVisible, setStep, step } = useCourse()
  const { localize } = useIntl()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const hasLessons = useMemo(() => course.lessons && course.lessons.length > 0, [course.lessons])

  const isCurrent = useCallback((index: number) => !infoVisible && index === step, [infoVisible, step])
  const isPast = useCallback((index: number) => index < step, [step])
  const isFuture = useCallback((index: number) => index > step, [step])
  const isCompleted = useCallback((index: number) => !!course.lessons?.[index].completed, [course.lessons])
  const isReachable = useCallback(
    (index: number) => {
      if (infoVisible) return true
      if (isCurrent(index)) return true
      if (isPast(index)) return true
      if (isFuture(index) && isCompleted(index - 1)) return true
      return false
    },
    [isCurrent, infoVisible, isPast, isFuture, isCompleted]
  )

  const formatLessonTitle = useCallback(
    (title: IntlRecord) => {
      const localized = localize(title, language.value)
      return <span className={cn(!localized && 'text-muted-foreground/50')}>{localized ?? t('untitledLesson')}</span>
    },
    [localize, language.value, t]
  )

  const formatLessonType = useCallback((type: string) => t('lessonType', { type }), [t])

  const formatLessonMessage = useCallback(
    (index: number) => {
      if (isReachable(index)) return
      return t('completeLessonsToProceed')
    },
    [isReachable, t]
  )

  const getRelations = useCallback(
    (index: number): RelationType[] =>
      index >= step
        ? []
        : [
            {
              sourceAnchor: 'bottom',
              targetAnchor: 'top',
              style: {
                strokeColor: 'var(--brand)',
                endMarker: false,
              },
              targetId: `${index + 1}`,
            },
          ],
    [step]
  )

  const onLessonClick = useCallback(
    (index: number) => {
      if (isCurrent(index)) return
      if (!isReachable(index)) return
      setStep(index)
    },
    [isCurrent, isReachable, setStep]
  )

  return (
    <div className="hidden md:block">
      <div className="sticky top-[120px] space-y-2 pr-2">
        <div
          className={cn(
            'relative mb-4 flex h-12 cursor-pointer items-center rounded-lg p-3 pl-12 hover:bg-accent/40 dark:hover:bg-accent/20',
            infoVisible ? 'pointer-events-none bg-accent/50 dark:bg-accent/30' : 'text-foreground/50'
          )}
          onClick={() => setInfoVisible(true)}
          title={t('infoTitle', { lang: language.displayLabel })}
        >
          <div
            className={cn(
              '-translate-1/2 absolute top-1/2 left-6 z-10 flex size-6 items-center justify-center rounded-sm border bg-accent',
              infoVisible && 'border-brand bg-brand text-brand-foreground'
            )}
          >
            <InformationIcon className={cn('size-6 text-muted-foreground', infoVisible && 'text-white')} />
          </div>
          <div className={cn('flex-1')}>
            <span className="inline-block font-medium text-sm">{t('info')}</span>
          </div>
        </div>
        {hasLessons && (
          <ArcherContainer>
            <div className="relative">
              {course.lessons?.map((lesson, index) => (
                <div
                  className={cn(
                    'group/course-step relative mb-4 flex cursor-pointer items-center rounded-md p-3 pl-12',
                    isCurrent(index) && 'cursor-default bg-accent/50 dark:bg-accent/30',
                    isReachable(index) && 'hover:bg-accent/40 dark:hover:bg-accent/20',
                    !isReachable(index) && 'cursor-not-allowed text-muted-foreground'
                  )}
                  key={index}
                  onClick={onLessonClick.bind(null, index)}
                  title={formatLessonMessage(index)}
                >
                  <div
                    className={cn(
                      '-translate-1/2 absolute top-1/2 left-6 z-10 flex size-5.5 items-center justify-center rounded-full border transition-colors',
                      isCurrent(index) || isPast(index)
                        ? 'border-brand bg-brand text-brand-foreground'
                        : 'border-border bg-background group-hover/course-step:bg-accent/20'
                    )}
                  >
                    <ArcherElement id={String(index)} key={lesson.id} relations={getRelations(index)}>
                      <span className="text-xs">{index + 1}</span>
                    </ArcherElement>
                  </div>
                  <div className={cn('flex-1 opacity-85', isCurrent(index) && 'opacity-100')}>
                    <span className="relative inline-block font-medium text-sm">
                      {formatLessonTitle(lesson.title)}
                      {user.canEdit && mode === 'editor' && isCurrent(index) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button className="-right-3.5 absolute top-1.5" size="text" variant="transparent">
                              <EditIcon className="size-2.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('editTitle')}</TooltipContent>
                        </Tooltip>
                      )}
                      {user.isLearner && isCompleted(index) && (
                        <span className="ml-1 text-success text-xs">{' ✔︎'}</span>
                      )}
                    </span>
                    <p className="text-xs opacity-80">{formatLessonType(lesson.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ArcherContainer>
        )}
      </div>
    </div>
  )
}
