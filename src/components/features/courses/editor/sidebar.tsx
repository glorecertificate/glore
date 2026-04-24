'use client'

import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CheckIcon, GripVerticalIcon, LoaderCircleIcon, PlusIcon, XIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { normalizeContent, useCourse } from '@/components/features/courses/editor/context'
import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable'
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
import { type Course } from '@/db/queries/course'
import { type Lesson } from '@/db/queries/lesson'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord, localizeRecord } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

const MAX_LESSON_TITLE_LENGTH = 120

const CourseSidebarItem = memo(
  forwardRef<
    HTMLDivElement,
    {
      initialCourse: Course
      isCompleted: boolean
      isCurrent: boolean
      isReachable: boolean
      isSingleLesson: boolean
      language: Locale
      lesson: Lesson
      onRemove: (id: number) => void
      onSelect: (step: number) => void
      setLesson: (data: Lesson) => void
      step: number
    }
  >(
    (
      {
        initialCourse,
        isCompleted,
        isCurrent,
        isReachable,
        isSingleLesson,
        language,
        lesson,
        onRemove,
        onSelect,
        setLesson,
        step,
        ...props
      },
      ref
    ) => {
      const { user } = useSession()
      const t = useTranslations('Courses')

      const title = lesson.title ? localizeRecord(lesson.title, language) : t('untitledLesson')
      const [draftTitle, setDraftTitle] = useState(title)
      const inputRef = useRef<HTMLTextAreaElement>(null)
      const lessonRef = useRef(lesson)
      lessonRef.current = lesson

      useEffect(() => {
        if (document.activeElement !== inputRef.current) {
          setDraftTitle(title)
        }
      }, [title])

      const hasUpdates = useMemo(() => {
        const initialLesson = initialCourse.lessons.find(l => l.id === lesson.id)

        if (!initialLesson) return true

        const initialContent = (initialLesson.content as IntlRecord)?.[language]
        const lessonContent = (lesson.content as IntlRecord)?.[language]

        const initialLessonData = {
          title: initialLesson.title?.[language],
          content: normalizeContent(initialContent),
        }
        const lessonData = {
          title: lesson.title?.[language],
          content: normalizeContent(lessonContent),
        }
        return JSON.stringify(initialLessonData) !== JSON.stringify(lessonData)
      }, [initialCourse.lessons, language, lesson.content, lesson.id, lesson.title])

      const commitTitle = useMemo(
        () =>
          debounce(value => {
            const current = lessonRef.current
            setLesson({
              id: current.id,
              title: {
                ...current.title,
                [language]: value,
              },
            } as Lesson)
          }, 250),
        [language, setLesson]
      )

      const onTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = e.target.value.slice(0, MAX_LESSON_TITLE_LENGTH)
          setDraftTitle(value)
          commitTitle(value)
        },
        [commitTitle]
      )

      const onLessonClick = useCallback(() => {
        if (isCurrent || !isReachable) return
        onSelect(step)
      }, [isCurrent, isReachable, onSelect, step])

      return (
        <StepperItem
          className="group relative w-full"
          loading={user.canEdit ? false : undefined}
          ref={ref}
          step={step}
          {...props}
        >
          <StepperTrigger
            className={cn(
              'relative flex w-full cursor-pointer items-start rounded-md p-3',
              isCurrent && 'cursor-default bg-accent/50 dark:bg-accent/30',
              isReachable && !isCurrent && 'hover:bg-accent/40 dark:hover:bg-accent/20',
              !isReachable && 'cursor-not-allowed text-muted-foreground'
            )}
            onClick={onLessonClick}
            onKeyDown={e => {
              if (e.key === 'Enter' && user.canEdit) {
                e.preventDefault()
                inputRef.current?.focus()
              }
            }}
            title={isReachable ? undefined : t('completeLessonsToProceed')}
          >
            <div className="relative">
              <StepperIndicator
                className={cn(
                  user.isLearner &&
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-success data-[state=completed]:text-foreground data-[state=inactive]:text-foreground/50'
                )}
              >
                {step}
              </StepperIndicator>
              {user.canEdit && hasUpdates && (
                <span className="absolute -top-0.5 -right-0.5 z-10 block size-2.5 rounded-full border-2 border-background bg-warning" />
              )}
            </div>
            <div
              className={cn(
                'mt-0.5 flex min-w-0 flex-1 flex-col gap-1 text-left opacity-85',
                isCurrent && 'opacity-100'
              )}
            >
              <StepperTitle>
                {user.canEdit ? (
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InlineInput
                          className="peer -ml-1 max-w-[calc(100%-12px)] cursor-text focus:max-w-full"
                          maxLength={MAX_LESSON_TITLE_LENGTH}
                          onChange={onTitleChange}
                          onClick={e => e.stopPropagation()}
                          ref={inputRef}
                          value={draftTitle}
                        />
                      </TooltipTrigger>
                      <TooltipContent align="start" sideOffset={6} size="sm">
                        {t('renameLesson')}
                      </TooltipContent>
                    </Tooltip>
                    {!isSingleLesson && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="absolute -top-2 -right-1 rounded-full p-px opacity-0 group-hover:opacity-100 peer-focus:opacity-0 hover:border-destructive-accent hover:bg-destructive/75 hover:text-destructive-foreground"
                            onClick={e => {
                              e.stopPropagation()
                              if (isSingleLesson) {
                                return toast.error(t('courseMustHaveAtLeastOneLesson'))
                              }
                              onRemove(lesson.id!)
                            }}
                            size="text"
                            variant="transparent"
                          >
                            <XIcon className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" size="sm">
                          {t('removeLesson')}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  title
                )}
                {user.isLearner && isCompleted && <span className="ml-1 text-xs text-success">{' ✔︎'}</span>}
              </StepperTitle>
              <StepperDescription>{t('lessonType', { type: lesson.type })}</StepperDescription>
            </div>
          </StepperTrigger>

          <StepperSeparator
            className={cn(
              'absolute inset-y-0 top-10 left-6 -order-1 m-0 h-[calc(100%-0.5rem)]! -translate-x-1/2',
              user.isLearner && 'group-data-[state=completed]/step:bg-success'
            )}
          />
        </StepperItem>
      )
    }
  )
)

export const CourseSidebar = (props: React.ComponentProps<'div'>) => {
  const { course, courseRef, language, step, setCourse, setLesson, setStep, addLesson, removeLesson } = useCourse()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const currentLessonId = course.lessons[step - 1]?.id
  const isStudent = user.isLearner || user.isVolunteer
  const progressColor = course.progress === 100 ? 'success' : 'default'

  const indicators = useMemo(
    () => ({
      completed: user.isLearner ? <CheckIcon className="size-4" /> : undefined,
      loading: <LoaderCircleIcon className="size-4 animate-spin" />,
    }),
    [user.isLearner]
  )

  const onReorder = useCallback(
    (newLessons: Lesson[]) => {
      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        sortOrder: index + 1,
      }))
      setCourse(prev => ({ ...prev, lessons: updatedLessons }))

      if (currentLessonId) {
        const newIndex = updatedLessons.findIndex(l => l.id === currentLessonId)
        if (newIndex !== -1 && newIndex + 1 !== step) {
          setStep(newIndex + 1)
        }
      }
    },
    [setCourse, setStep, step, currentLessonId]
  )

  return (
    <div {...props}>
      {isStudent && (
        <div className="flex items-center gap-2 py-2 pr-2 pl-3">
          <Progress className="h-1.5" color={progressColor} value={course.progress} />
          <span className="shrink-0 text-xs text-muted-foreground">{course.progress}%</span>
        </div>
      )}
      <Sortable getItemValue={lesson => lesson.id!} onValueChange={onReorder} value={course.lessons}>
        <Stepper
          className="sticky top-30 flex items-center gap-10 space-y-2 pr-2"
          defaultValue={step}
          indicators={indicators}
          onValueChange={setStep}
          orientation="vertical"
          value={step}
        >
          <SortableContent asChild>
            <StepperNav className="w-full items-start gap-4">
              {course.lessons.map((lesson, index) => {
                const itemStep = index + 1
                const isCurrent = step === itemStep
                const isPast = itemStep < step
                const isFuture = itemStep > step
                const isCompleted = user.canEdit || !!lesson.completed
                const previousCompleted = index > 0 ? !!course.lessons[index - 1].completed : true
                const isReachable = user.canEdit || isCurrent || isPast || (isFuture && previousCompleted)

                return (
                  <SortableItem className="group/sortable relative w-full" key={lesson.id} value={lesson.id!}>
                    {user.canEdit && (
                      <SortableItemHandle className="absolute top-4 -left-6 z-10 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover/sortable:opacity-100 dark:text-muted-foreground/50">
                        <GripVerticalIcon className="size-4" />
                      </SortableItemHandle>
                    )}
                    <CourseSidebarItem
                      initialCourse={courseRef.current}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isReachable={isReachable}
                      isSingleLesson={course.lessons.length === 1}
                      language={language}
                      lesson={lesson}
                      onRemove={removeLesson}
                      onSelect={setStep}
                      setLesson={setLesson}
                      step={itemStep}
                    />
                  </SortableItem>
                )
              })}
            </StepperNav>
          </SortableContent>
          <SortableOverlay>
            {({ value }) => {
              const lesson = course.lessons.find(({ id }) => id === value)
              if (!lesson) return null

              const index = course.lessons.indexOf(lesson)
              const itemStep = index + 1
              const isCurrent = step === itemStep
              const isPast = itemStep < step
              const isFuture = itemStep > step
              const isCompleted = user.canEdit || !!lesson.completed
              const previousCompleted = index > 0 ? !!course.lessons[index - 1].completed : true
              const isReachable = user.canEdit || isCurrent || isPast || (isFuture && previousCompleted)

              return (
                <div className="group/sortable relative w-full">
                  <CourseSidebarItem
                    initialCourse={courseRef.current}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isReachable={isReachable}
                    isSingleLesson={course.lessons.length === 1}
                    language={language}
                    lesson={lesson}
                    onRemove={removeLesson}
                    onSelect={setStep}
                    setLesson={setLesson}
                    step={itemStep}
                  />
                </div>
              )
            }}
          </SortableOverlay>
        </Stepper>
      </Sortable>
      <div className="flex h-16 items-center pl-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="z-1 size-6 rounded-full" onClick={() => addLesson()}>
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
