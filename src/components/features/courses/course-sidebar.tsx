'use client'

import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CheckIcon, GripVerticalIcon, LoaderCircleIcon, PlusIcon, XIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { type Value } from 'platejs'
import { toast } from 'sonner'

import { useCourse } from '@/components/features/courses/course-provider'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
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
import { type Course } from '@/db/schema/courses'
import { type Lesson } from '@/db/schema/lessons'
import { type IntlRecord, localize } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

const MAX_LESSON_TITLE_LENGTH = 120

const parseInitialContent = (content?: string | Value) => {
  if (!content) return null
  if (typeof content === 'string' && content.trim() === '') return null
  if (
    Array.isArray(content) &&
    content.length === 1 &&
    (content[0].type === 'p' || content[0].type === 'paragraph') &&
    Array.isArray(content[0].children) &&
    content[0].children.length === 1 &&
    content[0].children[0].text === ''
  )
    return null
  return content as Value
}

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

      const title = localize(lesson.title, language)
      const [draftTitle, setDraftTitle] = useState(title)
      const inputRef = useRef<HTMLTextAreaElement>(null)

      useEffect(() => {
        setDraftTitle(title)
      }, [title])

      const hasUpdates = useMemo(() => {
        const initialLesson = initialCourse.lessons.find(l => l.id === lesson.id)

        if (!initialLesson) return true

        const initialContent = (initialLesson.content as IntlRecord)?.[language]
        const lessonContent = (lesson.content as IntlRecord)?.[language]

        const initialLessonData = {
          title: initialLesson.title?.[language],
          content: parseInitialContent(initialContent),
        }
        const lessonData = {
          title: lesson.title?.[language],
          content: parseInitialContent(lessonContent),
        }
        return JSON.stringify(initialLessonData) !== JSON.stringify(lessonData)
      }, [initialCourse.lessons, language, lesson.content, lesson.id, lesson.title])

      const commitTitle = useMemo(
        () =>
          debounce(value => {
            setLesson({
              id: lesson.id,
              title: {
                ...lesson.title,
                [language]: value,
              },
            } as Lesson)
          }, 250),
        [language, lesson.id, lesson.title, setLesson]
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
                    'data-[state=active]:bg-primary data-[state=completed]:bg-success data-[state=active]:text-primary-foreground data-[state=completed]:text-foreground data-[state=inactive]:text-foreground/50'
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="absolute -top-2 -right-1 rounded-full p-px opacity-0 hover:border-destructive-accent hover:bg-destructive/75 hover:text-destructive-foreground group-hover:opacity-100 peer-focus:opacity-0"
                          onClick={e => {
                            e.stopPropagation()
                            isSingleLesson ? toast.error(t('courseMustHaveAtLeastOneLesson')) : onRemove(lesson.id)
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
                  </div>
                ) : (
                  title
                )}
                {user.isLearner && isCompleted && <span className="ml-1 text-success text-xs">{' ✔︎'}</span>}
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
  const { addLesson, initialCourse, language, lessons, removeLesson, setCourse, setLesson, setStep, step } = useCourse()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const onReorder = useCallback(
    (newLessons: Lesson[]) => {
      const currentLessonId = lessons[step - 1]?.id

      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        sort_order: index + 1,
      }))
      setCourse(prev => ({ ...prev, lessons: updatedLessons }))

      if (currentLessonId) {
        const newIndex = updatedLessons.findIndex(l => l.id === currentLessonId)
        if (newIndex !== -1 && newIndex + 1 !== step) {
          setStep(newIndex + 1)
        }
      }
    },
    [lessons, setCourse, setStep, step]
  )

  return (
    <div {...props}>
      <Sortable getItemValue={lesson => lesson.id} onValueChange={onReorder} value={lessons}>
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
          <SortableContent asChild>
            <StepperNav className="w-full items-start gap-4">
              {lessons.map((lesson, index) => {
                const itemStep = index + 1
                const isCurrent = step === itemStep
                const isPast = itemStep < step
                const isFuture = itemStep > step
                const isCompleted = user.canEdit || !!lesson.completed
                const previousCompleted = index > 0 ? !!lessons[index - 1].completed : true
                const isReachable = user.canEdit || isCurrent || isPast || (isFuture && previousCompleted)

                return (
                  <SortableItem className="group/sortable relative w-full" key={lesson.id} value={lesson.id}>
                    {user.canEdit && (
                      <SortableItemHandle className="absolute top-4 -left-6 z-10 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover/sortable:opacity-100 dark:text-muted-foreground/50">
                        <GripVerticalIcon className="size-4" />
                      </SortableItemHandle>
                    )}
                    <CourseSidebarItem
                      initialCourse={initialCourse}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isReachable={isReachable}
                      isSingleLesson={lessons.length === 1}
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
              const lesson = lessons.find(l => l.id === value)
              if (!lesson) return null

              const index = lessons.indexOf(lesson)
              const itemStep = index + 1
              const isCurrent = step === itemStep
              const isPast = itemStep < step
              const isFuture = itemStep > step
              const isCompleted = user.canEdit || !!lesson.completed
              const previousCompleted = index > 0 ? !!lessons[index - 1].completed : true
              const isReachable = user.canEdit || isCurrent || isPast || (isFuture && previousCompleted)

              return (
                <div className="group/sortable relative w-full">
                  <CourseSidebarItem
                    initialCourse={initialCourse}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isReachable={isReachable}
                    isSingleLesson={lessons.length === 1}
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
