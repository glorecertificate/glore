'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { CheckIcon, LoaderCircleIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { getLessonType, useCourse } from '@/components/features/courses/course-provider'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Lesson } from '@/db/schema/lessons'
import { localize } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

const CourseSidebarItem = ({ lesson, step }: { lesson: Lesson; step: number }) => {
  const { course, language, setLesson, setStep, step: courseStep } = useCourse()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const title = localize(lesson.title, language)
  const [draftTitle, setDraftTitle] = useState(title)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  const isCurrent = step === courseStep
  const isPast = step < courseStep
  const isFuture = step > courseStep
  const isCompleted = user.canEdit || !!course.lessons[step - 1].completed
  const isReachable = user.canEdit || isCurrent || isPast || (isFuture && !!course.lessons[step - 2]?.completed)

  const commitTitle = useMemo(
    () =>
      debounce((value: string) => {
        setLesson({
          title: {
            ...lesson.title,
            [language]: value,
          },
        })
      }, 250),
    [language, lesson.title, setLesson]
  )

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setDraftTitle(value)
      commitTitle(value)
    },
    [commitTitle]
  )

  const onLessonClick = useCallback(() => {
    if (isCurrent || !isReachable) return
    setStep(step)
  }, [isCurrent, isReachable, setStep, step])

  return (
    <StepperItem className="relative w-full" loading={user.canEdit ? false : undefined} step={step}>
      <StepperTrigger
        className={cn(
          'flex w-full cursor-pointer items-center rounded-md p-3',
          isCurrent && 'cursor-default bg-accent/50 dark:bg-accent/30',
          isReachable && !isCurrent && 'hover:bg-accent/40 dark:hover:bg-accent/20',
          !isReachable && 'cursor-not-allowed text-muted-foreground'
        )}
        onClick={onLessonClick}
        title={isReachable ? undefined : t('completeLessonsToProceed')}
      >
        <StepperIndicator
          className={cn(
            user.isLearner &&
              'data-[state=active]:bg-primary data-[state=completed]:bg-success data-[state=active]:text-primary-foreground data-[state=completed]:text-foreground data-[state=inactive]:text-foreground/50'
          )}
        >
          {step}
        </StepperIndicator>
        <div className={cn('mt-0.5 flex-1 text-left opacity-85', isCurrent && '-mt-0.5 opacity-100')}>
          <StepperTitle>
            {user.canEdit && isCurrent ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InlineInput className="-mb-1.25 -ml-1.25" onChange={onTitleChange} value={draftTitle} />
                </TooltipTrigger>
                <TooltipContent sideOffset={6} size="sm">
                  {t('renameLesson')}
                </TooltipContent>
              </Tooltip>
            ) : (
              title
            )}
            {user.isLearner && isCompleted && <span className="ml-1 text-success text-xs">{' ✔︎'}</span>}
          </StepperTitle>
          <StepperDescription>{t('lessonType', { type: getLessonType(lesson) })}</StepperDescription>
        </div>
      </StepperTrigger>

      <StepperSeparator
        className={cn(
          'absolute inset-y-0 top-10 left-6 -order-1 m-0 h-[calc(100%-2rem)] -translate-x-1/2',
          user.isLearner && 'group-data-[state=completed]/step:bg-success'
        )}
      />
    </StepperItem>
  )
}

export const CourseSidebar = (props: React.ComponentProps<'div'>) => {
  const { addLesson, course, step, setStep } = useCourse()
  const { user } = useSession()
  const t = useTranslations('Courses')

  return (
    <div {...props}>
      <Stepper
        className="sticky top-30 flex items-center gap-10 space-y-2 pr-2"
        defaultValue={step}
        indicators={{
          completed: user.isLearner ? <CheckIcon className="size-4" /> : undefined,
          loading: <LoaderCircleIcon className="size-4 animate-spin" />,
        }}
        onValueChange={setStep}
        orientation="vertical"
        value={step}
      >
        <StepperNav className="w-full items-start gap-4">
          {course.lessons.map((lesson, index) => (
            <CourseSidebarItem key={lesson.id ?? index + 1} lesson={lesson} step={index + 1} />
          ))}
        </StepperNav>
      </Stepper>
      <div className="flex h-16 items-center pl-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="size-6 rounded-full" onClick={() => addLesson()}>
              <PlusIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('addLesson')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export const CourseSidebarSkeleton = () => (
  <div className="hidden md:block">
    <div className="sticky top-30 space-y-4 pr-2">
      {[...Array(5)].map((_, i) => (
        <div className="relative" key={i}>
          <div className="mb-4 flex items-center pl-12">
            <div className="absolute top-1/2 left-6 -translate-y-1/2">
              <Skeleton className="flex h-6 w-6 items-center justify-center rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex h-16 items-center pl-3">
        <Skeleton className="size-6 rounded-full" />
      </div>
    </div>
  </div>
)
