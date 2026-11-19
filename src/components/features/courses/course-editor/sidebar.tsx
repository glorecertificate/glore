'use client'

import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from 'motion/react'
import { type Locale, useTranslations } from 'next-intl'

import { normalizeContent, useCourse } from '@/components/features/courses/course-editor/context'
import { LucideIcon } from '@/components/icons/lucide'
import { useSession } from '@/components/providers/session'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Button } from '@/components/ui/button'
import { InlineInput } from '@/components/ui/inline-input'
import { Progress } from '@/components/ui/progress'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
  animateLayoutChangesAlways,
  measureAlways,
} from '@/components/ui/sortable'
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
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/queries/course'
import { type Lesson } from '@/db/queries/lesson'
import { DEFAULT_LOCALE, type IntlRecord, localizeRecord } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

const MAX_LESSON_TITLE_LENGTH = 120

const CourseSidebarItem = ({
  initialCourse,
  isLast,
  isSingleLesson,
  language,
  lesson,
  lessonStatus,
  onChoose,
  onMove,
  onRemove,
  onSelect,
  setLesson,
  step,
  ...props
}: Omit<React.ComponentProps<typeof StepperItem>, 'onSelect'> & {
  initialCourse: Course
  isLast: boolean
  isSingleLesson: boolean
  language: Locale
  lesson: Lesson
  lessonStatus: { isCompleted: boolean; isCurrent: boolean; isReachable: boolean }
  onChoose?: () => void
  onMove?: (direction: -1 | 1) => void
  onRemove: (id: number) => void
  onSelect: (step: number) => void
  setLesson: (data: Lesson) => void
  step: number
}) => {
  const { user } = useSession()
  const t = useTranslations('CourseEditor')
  const { isCompleted, isCurrent, isReachable } = lessonStatus

  const title = lesson.title ? localizeRecord(lesson.title, language) : t('untitledLesson')
  const fallbackTitle = lesson.title ? localizeRecord(lesson.title, DEFAULT_LOCALE) : t('untitledLesson')
  const [draftTitle, setDraftTitle] = useState(title)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lessonRef = useRef(lesson)
  lessonRef.current = lesson

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraftTitle(title)
    }
  }, [title])

  const hasUpdates = (() => {
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
  })()

  const commitTitle = debounce(value => {
    const current = lessonRef.current
    setLesson({
      id: current.id,
      title: {
        ...current.title,
        [language]: value,
      },
    } as Lesson)
  }, 250)

  const onTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_LESSON_TITLE_LENGTH)
    setDraftTitle(value)
    commitTitle(value)
  }

  const onLessonClick = () => {
    if (!isReachable) return
    if (!isCurrent) onSelect(step)
    onChoose?.()
  }

  const canRemove = user.canEdit && !isSingleLesson
  const showTouchActions = user.canEdit && (canRemove || onMove)

  return (
    <StepperItem className="group relative w-full" loading={user.canEdit ? false : undefined} step={step} {...props}>
      <StepperTrigger
        className={cn(
          'relative flex w-full cursor-pointer items-start rounded-md p-3',
          isCurrent && 'cursor-default bg-surface-selected',
          isReachable && !isCurrent && 'hover:bg-surface-hover',
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
        <div className="mt-0.5 flex min-w-0 flex-1 flex-col gap-1 text-left">
          <StepperTitle className={cn(!isCurrent && 'opacity-85')}>
            {user.canEdit ? (
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InlineInput
                      aria-label={t('renameLesson')}
                      className="peer -ml-1 max-w-[calc(100%-12px)] cursor-text focus:max-w-full"
                      maxLength={MAX_LESSON_TITLE_LENGTH}
                      onChange={onTitleChange}
                      onClick={e => e.stopPropagation()}
                      placeholder={fallbackTitle}
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
                        aria-label={t('removeLesson')}
                        className="absolute -top-2 -right-1 rounded-full p-px opacity-0 group-hover:opacity-100 peer-focus:opacity-0 hover:border-destructive-accent hover:bg-destructive/75 hover:text-destructive-foreground pointer-coarse:hidden"
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
                        <LucideIcon name="x" className="size-3" />
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
            {user.isLearner && isCompleted && <span className="ml-1 text-xs text-success-text">{' ✔︎'}</span>}
          </StepperTitle>
          <StepperDescription>{t('lessonType', { type: lesson.type })}</StepperDescription>
        </div>
        {showTouchActions && (
          <div
            className="hidden shrink-0 items-center gap-3 self-center pointer-coarse:flex"
            onClick={event => event.stopPropagation()}
          >
            {onMove && (
              <>
                <Button
                  aria-label={t('moveLessonUp')}
                  disabled={step === 1}
                  onClick={() => onMove(-1)}
                  size="icon-sm"
                  variant="outline"
                >
                  <LucideIcon name="arrow-up" />
                </Button>
                <Button
                  aria-label={t('moveLessonDown')}
                  disabled={isLast}
                  onClick={() => onMove(1)}
                  size="icon-sm"
                  variant="outline"
                >
                  <LucideIcon name="arrow-down" />
                </Button>
              </>
            )}
            {canRemove && (
              <Button
                aria-label={t('removeLesson')}
                className="text-destructive"
                onClick={() => onRemove(lesson.id!)}
                size="icon-sm"
                variant="outline"
              >
                <LucideIcon name="trash-2" />
              </Button>
            )}
          </div>
        )}
      </StepperTrigger>

      <StepperSeparator
        className={cn(
          isLast && 'hidden',
          'absolute inset-y-0 top-10 left-6 z-1 -order-1 m-0 h-[calc(100%-1rem)]! -translate-x-1/2',
          user.isLearner && 'data-[state=completed]:bg-success'
        )}
      />
    </StepperItem>
  )
}

export const CourseSidebar = ({
  onChoose,
  variant = 'inline',
  ...props
}: React.ComponentProps<'div'> & { onChoose?: () => void; variant?: 'inline' | 'sheet' }) => {
  const t = useTranslations('CourseEditor')
  const tList = useTranslations('CourseList')
  const { user } = useSession()
  const { course, courseRef, language, step, setCourse, setLesson, setStep, addLesson, removeLesson } = useCourse()
  const reducedMotion = useReducedMotion()

  const currentLessonId = course.lessons[step - 1]?.id
  const isStudent = user.isLearner || user.isVolunteer
  const progressColor = course.progress === 100 ? 'success' : 'default'

  const indicators = {
    completed: user.isLearner ? <LucideIcon name="check" className="size-4" /> : undefined,
    loading: <LucideIcon name="loader-circle" className="size-4 animate-spin" />,
  }

  const onReorder = (newLessons: Lesson[]) => {
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
  }

  const handleSelect = (s: number) => {
    void setStep(s)
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= course.lessons.length) return
    const lessons = [...course.lessons]
    const [moved] = lessons.splice(index, 1)
    lessons.splice(target, 0, moved)
    onReorder(lessons)
  }

  const isSheet = variant === 'sheet'

  return (
    <div {...props}>
      {isStudent && (
        <div className="flex items-center gap-2 py-2 pr-2 pl-3">
          <Progress aria-label={tList('completed')} className="h-1.5" color={progressColor} value={course.progress} />
          <span className="shrink-0 text-xs text-muted-foreground">
            {course.progress}
            {'%'}
          </span>
        </div>
      )}
      <div className={cn(!isSheet && 'sticky top-20')}>
        {!isSheet && (
          <div className="flex items-center justify-between gap-2 pr-2 pb-2 pl-3">
            <h2 className="type-label">{t('lessonsTitle')}</h2>
            <span className="type-caption text-muted-foreground tabular-nums">{course.lessons.length}</span>
          </div>
        )}
        <Sortable
          getItemValue={lesson => lesson.id!}
          measuring={measureAlways}
          onValueChange={onReorder}
          value={course.lessons}
        >
          <Stepper
            className="flex items-center gap-10 gap-y-2 pr-2"
            defaultValue={step}
            indicators={indicators}
            onValueChange={setStep}
            orientation="vertical"
            value={step}
          >
            <SortableContent asChild>
              <StepperNav className="w-full items-start gap-4">
                <AnimatedList>
                  {course.lessons.map((lesson, index) => {
                    const itemStep = index + 1
                    const isCurrent = step === itemStep
                    const isPast = itemStep < step
                    const isFuture = itemStep > step
                    const isCompleted = user.canEdit || !!lesson.completed
                    const previousCompleted = index > 0 ? !!course.lessons[index - 1].completed : true
                    const isReachable = user.canEdit || isCurrent || isPast || (isFuture && previousCompleted)

                    return (
                      <SortableItem
                        animateLayoutChanges={reducedMotion ? undefined : animateLayoutChangesAlways}
                        asChild
                        className="group/sortable relative w-full"
                        key={lesson.id}
                        value={lesson.id!}
                      >
                        <AnimatedListItem exitOnly>
                          {user.canEdit && (
                            <SortableItemHandle
                              aria-label={t('reorderLesson')}
                              className="touch-hit absolute top-4 -left-6 z-10 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover/sortable:opacity-100 pointer-coarse:opacity-100"
                            >
                              <LucideIcon name="grip-vertical" className="size-4" />
                            </SortableItemHandle>
                          )}
                          <CourseSidebarItem
                            initialCourse={courseRef.current}
                            isLast={index === course.lessons.length - 1}
                            isSingleLesson={course.lessons.length === 1}
                            language={language}
                            lesson={lesson}
                            lessonStatus={{ isCompleted, isCurrent, isReachable }}
                            onChoose={onChoose}
                            onMove={direction => handleMove(index, direction)}
                            onRemove={removeLesson}
                            onSelect={handleSelect}
                            setLesson={setLesson}
                            step={itemStep}
                          />
                        </AnimatedListItem>
                      </SortableItem>
                    )
                  })}
                </AnimatedList>
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
                      isLast={index === course.lessons.length - 1}
                      isSingleLesson={course.lessons.length === 1}
                      language={language}
                      lesson={lesson}
                      lessonStatus={{ isCompleted, isCurrent, isReachable }}
                      onRemove={removeLesson}
                      onSelect={handleSelect}
                      setLesson={setLesson}
                      step={itemStep}
                    />
                  </div>
                )
              }}
            </SortableOverlay>
          </Stepper>
        </Sortable>
        {user.canEdit && (
          <div className={cn('pt-3 pr-2 pl-3', isSheet && 'sticky bottom-0 bg-background pb-3')}>
            <Button className="w-full" icon="plus" onClick={() => addLesson()} variant="outline">
              {t('addLesson')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
