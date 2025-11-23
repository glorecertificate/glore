'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ArcherContainer, ArcherElement } from 'react-archer'
import { type RelationType } from 'react-archer/lib/types'

import { debounce } from '@glore/utils/debounce'

import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCourse } from '@/hooks/use-course'
import { useIntl } from '@/hooks/use-intl'
import { useSession } from '@/hooks/use-session'
import { DEFAULT_LESSON, type Lesson } from '@/lib/data'
import { cn } from '@/lib/utils'

const CourseSidebarLesson = ({ index, lesson }: { index: number; lesson: Partial<Lesson> }) => {
  const { course, language, setLesson, setStep, step } = useCourse()
  const { localize } = useIntl()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const title = localize(lesson.title, language)
  const [draftTitle, setDraftTitle] = useState(title)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  const isCurrent = index === step - 1
  const isPast = index < step - 1
  const isFuture = index > step - 1
  const isCompleted = !!course.lessons[index].completed
  const isReachable = isCurrent || isPast || (isFuture && !!course.lessons[index - 1]?.completed)

  const archerRelations = useMemo<RelationType[]>(() => {
    if (index > step) return []
    return [
      {
        sourceAnchor: 'bottom',
        targetAnchor: 'top',
        style: {
          strokeColor: 'var(--brand)',
          endMarker: false,
        },
        targetId: `${index + 1}`,
      },
    ]
  }, [index, step])

  const commitTitle = useMemo(() => {
    const nextTitle =
      typeof lesson.title === 'object' && lesson.title !== null ? (lesson.title as Record<string, string>) : {}

    return debounce((value: string) => {
      setLesson({
        title: {
          ...nextTitle,
          [language]: value,
        },
      })
    }, 250)
  }, [language, lesson.title, setLesson])

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
    setStep(index + 1)
  }, [isCurrent, isReachable, index, setStep])

  return (
    <div
      className={cn(
        'group/course-step relative mb-4 flex cursor-pointer items-center rounded-md p-3 pl-12',
        isCurrent && 'cursor-default bg-accent/50 dark:bg-accent/30',
        isReachable && !isCurrent && 'hover:bg-accent/40 dark:hover:bg-accent/20',
        !isReachable && 'cursor-not-allowed text-muted-foreground'
      )}
      onClick={onLessonClick}
      title={isReachable ? undefined : t('completeLessonsToProceed')}
    >
      <div
        className={cn(
          '-translate-1/2 absolute top-1/2 left-6 z-10 flex size-5.5 items-center justify-center rounded-full transition-colors',
          isCurrent || isPast
            ? 'bg-brand text-brand-foreground'
            : 'border border-input bg-background shadow-xs group-hover/course-step:bg-accent/20 dark:bg-input/30'
        )}
      >
        <ArcherElement id={String(index)} key={lesson.id} relations={archerRelations}>
          <span className="text-xs">{index + 1}</span>
        </ArcherElement>
      </div>
      <div className={cn('flex-1 opacity-85', isCurrent && 'opacity-100')}>
        <span className="relative inline-block font-medium text-sm">
          {user.canEdit && isCurrent ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* <span className={cn('cursor-text', !title && 'text-muted-foreground/50')}>{title}</span> */}
                <InlineInput onChange={onTitleChange} value={draftTitle} />
              </TooltipTrigger>
              <TooltipContent align="start" sideOffset={6} size="sm">
                {t('renameLesson')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>{title}</span>
          )}
          {user.isLearner && isCompleted && <span className="ml-1 text-success text-xs">{' ✔︎'}</span>}
        </span>
        {lesson.type && <p className="text-xs opacity-80">{t('lessonType', { type: lesson.type })}</p>}
      </div>
    </div>
  )
}

export const CourseSidebar = () => {
  const { course, setCourse } = useCourse()
  const t = useTranslations('Courses')

  const addLesson = useCallback(() => {
    setCourse(course => ({
      ...course,
      lessons: [...course.lessons, DEFAULT_LESSON],
    }))
  }, [setCourse])

  return (
    <div className="hidden md:block">
      <div className="sticky top-[120px] space-y-2 pr-2">
        <ArcherContainer>
          {course.lessons.map((lesson, i) => (
            <CourseSidebarLesson index={i} key={lesson.id ?? i} lesson={lesson} />
          ))}
        </ArcherContainer>
        <div className="flex h-16 items-center pl-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="size-6 rounded-full" onClick={addLesson}>
                <PlusIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t('addLesson')}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export const CourseSidebarSkeleton = () => (
  <div className="hidden md:block">
    <div className="sticky top-[120px] space-y-4 pr-2">
      {[...Array(5)].map((_, i) => (
        <div className="relative" key={i}>
          <div className="mb-4 flex items-center pl-12">
            <div className="-translate-y-1/2 absolute top-1/2 left-6">
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
