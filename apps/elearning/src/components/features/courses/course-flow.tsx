'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowLeftIcon, ChevronDownIcon, EyeIcon } from 'lucide-react'
import { toast } from 'sonner'

import { pick } from '@repo/utils'

import { api } from '@/api/client'
import { type Course, type Question, type QuestionOption } from '@/api/modules/courses/types'
import { CourseAssessment } from '@/components/features/courses/course-assessment'
import { CourseEvaluations } from '@/components/features/courses/course-evaluations'
import { CourseQuestions } from '@/components/features/courses/course-questions'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ConfettiButton } from '@/components/ui/confetti'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { Markdown } from '@/components/ui/markdown'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHeader } from '@/hooks/use-header'
import { useLocale } from '@/hooks/use-locale'
import { useScroll } from '@/hooks/use-scroll'
import { useSession } from '@/hooks/use-session'
import { useSyncState } from '@/hooks/use-sync-state'
import { useTranslations } from '@/hooks/use-translations'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import config from 'static/config.json'

export const CourseFlow = ({ course }: { course: Course }) => {
  const { setBreadcrumb, setHeaderShadow } = useHeader()
  const { localize } = useLocale()
  const { scrolled } = useScroll()
  const { courses, setCourses } = useSession()
  const { setSyncState } = useSyncState()
  const t = useTranslations()

  const [syncedCourse, setSyncedCourse] = useState(course)
  const title = useMemo(() => localize(course.title), [course, localize])

  useEffect(() => {
    setHeaderShadow(false)
    setBreadcrumb(
      <BreadcrumbList className="sm:gap-1">
        <BreadcrumbItem>
          <Button asChild variant="ghost">
            <Link href={Route.Courses}>{t('Navigation.courses')}</Link>
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="mr-3" />
        <BreadcrumbItem className="text-foreground">{title}</BreadcrumbItem>
      </BreadcrumbList>,
    )
  }, [setBreadcrumb, setHeaderShadow, title, t])

  const initialLessonIndex = useMemo(() => {
    if (!course || course.status === 'completed') return 0
    const incompletedIndex = course.lessons?.findIndex(lesson => !lesson.completed)
    if (incompletedIndex !== -1) return incompletedIndex || 0
    return (course.lessons?.length || 0) - 1
  }, [course])

  const [currentLessonIndex, setCurrentLessonIndex] = useState(initialLessonIndex)

  const currentLesson = useMemo(() => course.lessons?.[currentLessonIndex], [course.lessons, currentLessonIndex])
  const currentSyncedLesson = useMemo(
    () => syncedCourse.lessons?.[currentLessonIndex],
    [syncedCourse.lessons, currentLessonIndex],
  )
  const hasLessons = useMemo(() => course.lessons && course.lessons.length > 0, [course.lessons])
  const isFirstLesson = useMemo(() => currentLessonIndex === 0, [currentLessonIndex])
  const isLastLesson = useMemo(
    () => currentLessonIndex === course.lessonsCount - 1,
    [currentLessonIndex, course.lessonsCount],
  )
  const canProceed = useMemo(() => {
    if (!currentLesson) return false
    if (currentLesson.type === 'descriptive' || currentLesson.completed) return true
    if (currentLesson.type === 'questions')
      return currentLesson.questions?.every(q => q.options.some(o => o.isUserAnswer))
    if (currentLesson.type === 'evaluations') return currentLesson.evaluations?.every(e => !!e.userRating)
    if (currentLesson.type === 'assessment') return !!currentLesson.assessment?.userRating
    return false
  }, [currentLesson])
  const courseProgressColor = useMemo(() => (course.progress === 100 ? 'success' : 'default'), [course.progress])

  const isCurrentLesson = useCallback((index: number) => index === currentLessonIndex, [currentLessonIndex])
  const isPastLesson = useCallback((index: number) => index < currentLessonIndex, [currentLessonIndex])
  const isFutureLesson = useCallback((index: number) => index > currentLessonIndex, [currentLessonIndex])
  const isCompletedLesson = useCallback((index: number) => !!course.lessons?.[index].completed, [course.lessons])
  const isReachableLesson = useCallback(
    (index: number) => {
      if (isCurrentLesson(index)) return true
      if (isPastLesson(index)) return true
      if (isFutureLesson(index) && isCompletedLesson(index - 1)) return true
      return false
    },
    [isCurrentLesson, isPastLesson, isFutureLesson, isCompletedLesson],
  )

  const setCourse = useCallback(
    (updater: (course: Course) => Course) => {
      setCourses(courses => courses.map(m => (m.id === course.id ? updater(m) : m)))
    },
    [setCourses, course],
  )

  const onQuestionAnswer = useCallback(
    async (question: Question, option: QuestionOption) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map((lesson, i) =>
          i === currentLessonIndex
            ? {
                ...lesson,
                questions: lesson.questions?.map(q =>
                  q.id === question.id
                    ? {
                        ...q,
                        answered: true,
                        options: q.options.map(o => ({ ...o, isUserAnswer: o.id === option.id })),
                      }
                    : q,
                ),
              }
            : lesson,
        ),
      }))
      try {
        setSyncState('syncing')
        await api.courses.submitAnswers([{ id: question.id }])
        setSyncState('complete')
      } catch (e) {
        setSyncState('error')
        console.error(e)
      }
    },
    [currentLessonIndex, setCourse, setSyncState],
  )
  const onEvaluation = useCallback(
    (id: number, rating: number) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map(({ evaluations, ...lesson }, i) =>
          i === currentLessonIndex
            ? {
                ...lesson,
                evaluations: evaluations?.map(e => (e.id === id ? { ...e, userRating: rating } : e)),
              }
            : lesson,
        ),
      }))
    },
    [currentLessonIndex, setCourse],
  )

  const onAssessment = useCallback(
    (rating: number) => {
      setCourse(({ lessons, ...course }) => ({
        ...course,
        lessons: lessons?.map((lesson, i) =>
          i === currentLessonIndex && lesson.assessment
            ? { ...lesson, assessment: { ...lesson.assessment, userRating: rating } }
            : lesson,
        ),
      }))
    },
    [currentLessonIndex, setCourse],
  )

  const handlePrevious = useCallback(() => {
    if (!isFirstLesson) setCurrentLessonIndex(currentLessonIndex - 1)
  }, [currentLessonIndex, isFirstLesson])

  const handleNext = useCallback(async () => {
    try {
      const lesson = currentLesson
      const lessonIndex = currentLessonIndex

      if (!isLastLesson) setCurrentLessonIndex(i => i + 1)
      if (currentSyncedLesson?.completed) return

      setCourse(course => ({
        ...course,
        lessons: course.lessons?.map((s, i) => (i === lessonIndex ? { ...s, completed: true } : s)),
        status: isLastLesson ? 'completed' : course.status,
        completed: isLastLesson,
      }))

      setSyncState('syncing')

      if (lesson) await api.courses.completeLesson(lesson.id)

      switch (lesson?.type) {
        case 'questions': {
          const options = lesson.questions?.flatMap(q => q.options.filter(o => o.isUserAnswer).map(o => ({ id: o.id })))
          if (!options || options.length === 0) return
          await api.courses.submitAnswers(pick(options, 'id'))
          break
        }
        case 'evaluations': {
          if (!lesson.evaluations) return
          await api.courses.submitEvaluations(lesson.evaluations.map(e => ({ id: e.id, value: e.userRating! })))
          break
        }
        case 'assessment': {
          const id = lesson.assessment?.id
          const value = lesson.assessment?.userRating
          if (!id || !value) return
          await api.courses.submitAssessment(id, value)
        }
      }

      setSyncedCourse(course)
      setSyncState('complete')
    } catch (e) {
      toast.error(t('Common.syncErrorMessage'), {
        dismissible: false,
        position: 'bottom-right',
      })
      setSyncState('error')
      console.error(e)
    }
  }, [
    currentLesson,
    currentLessonIndex,
    isLastLesson,
    course,
    setCourse,
    setSyncState,
    t,
    currentSyncedLesson?.completed,
  ])

  const onLessonButtonClick = useCallback(
    async (index: number) => {
      if (index > currentLessonIndex && !currentLesson?.completed) return
      if (index === currentLessonIndex + 1) return handleNext()
      setCurrentLessonIndex(index)
    },
    [currentLesson?.completed, currentLessonIndex, handleNext],
  )

  const formatLessonType = useCallback(
    (type: string) =>
      t('Courses.lessonType', {
        type,
      }),
    [t],
  )
  const formatLessonTitle = useCallback(
    (index: number) => {
      if (!isReachableLesson(index)) return t('Courses.completeLessonsToProceed')
    },
    [isReachableLesson, t],
  )
  const nextTooltip = useMemo(() => {
    if (!currentLesson) return undefined

    if (!canProceed)
      return t('Courses.replyToProceed', {
        type: currentLesson.type,
      })
  }, [canProceed, currentLesson, t])

  const completedCoursesCount = useMemo(() => courses.filter(m => m.status === 'completed').length, [courses])
  const completedTitle = useMemo(
    () =>
      completedCoursesCount === courses.length
        ? t('Courses.completedTitleAll')
        : t('Courses.completedTitle', {
            count: completedCoursesCount,
          }),
    [completedCoursesCount, courses.length, t],
  )
  const completedMessage = useMemo(
    () =>
      completedCoursesCount < 3
        ? t('Courses.completedMessage')
        : completedCoursesCount === config.minSkills
          ? t('Courses.completedRequestCertificate')
          : t('Courses.completeIncludeInCertificate'),
    [completedCoursesCount, t],
  )

  return (
    <div className="container mx-auto flex flex-1 px-8 pb-8">
      {/* Sidebar */}
      <div className="mr-2 hidden max-w-lg min-w-52 flex-1/4 shrink-0 md:block md:max-lg:flex-1/3">
        <div className="sticky top-[72px] flex items-center gap-2">
          <span className="pt-1 text-sm text-muted-foreground">
            {hasLessons
              ? t('Courses.lessonCount', {
                  count: String(currentLessonIndex + 1),
                  total: String(course.lessons?.length || 0),
                })
              : ''}
          </span>
        </div>
        <div className="sticky top-[120px] space-y-2 pr-2">
          {hasLessons && (
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
                    isCurrentLesson(index) && 'pointer-events-none bg-accent/50',
                    isReachableLesson(index) && 'hover:bg-accent/50',
                    !isReachableLesson(index) && 'cursor-not-allowed text-muted-foreground',
                  )}
                  key={lesson.id}
                  onClick={onLessonButtonClick.bind(null, index)}
                  title={formatLessonTitle(index)}
                >
                  <div
                    className={cn(
                      'absolute top-1/2 left-6 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border',
                      isCurrentLesson(index) || isPastLesson(index)
                        ? 'border-secondary-accent bg-secondary text-secondary-foreground'
                        : 'border-border bg-background',
                    )}
                  >
                    <span className="text-xs">{index + 1}</span>
                  </div>
                  <div className={cn('flex-1 opacity-85', isCurrentLesson(index) && 'opacity-100')}>
                    <span className="inline-block text-sm font-medium">
                      {localize(lesson.title)}{' '}
                      {isCompletedLesson(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                    </span>
                    <p className="text-xs opacity-80">{formatLessonType(lesson.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Mobile header */}
        <div
          className={cn('sticky top-[72px] flex flex-col gap-4 bg-background pb-4 md:hidden', scrolled && 'border-b')}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full justify-between py-6" variant="outline">
                <div className="flex flex-col items-start">
                  {currentLesson ? (
                    <>
                      <span className="font-medium">{localize(currentLesson.title)}</span>
                      <span className="text-xs text-muted-foreground">{formatLessonType(currentLesson.type)}</span>
                    </>
                  ) : (
                    <span className="font-medium">{'No lessons'}</span>
                  )}
                </div>
                <ChevronDownIcon className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {course.lessons ? (
                course.lessons.map((lesson, index) => (
                  <DropdownMenuItem
                    className="flex justify-between py-2"
                    key={lesson.id}
                    onClick={() => setCurrentLessonIndex(index)}
                  >
                    <div className="flex flex-col">
                      <span className={cn(isCurrentLesson(index) && 'font-semibold')}>
                        {localize(lesson.title)}{' '}
                        {isCompletedLesson(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatLessonType(lesson.type)}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="flex justify-between py-2">
                  <div className="flex flex-col">
                    <span>{'Add lesson'}</span>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {course.status !== 'completed' && (
            <div className="flex items-center justify-end gap-2 bg-background md:top-[72px]">
              <span className="text-sm">
                {course.progress}
                {'%'}
              </span>
              <Progress className="md:max-w-sm" color={courseProgressColor} value={course.progress} />
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          className={cn(
            'sticky top-36 hidden items-center justify-end gap-2 bg-background pb-6 md:top-[72px] md:flex',
            scrolled && 'border-b',
          )}
        >
          {course.status === 'completed' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className="mr-2 cursor-help rounded-full border-muted-foreground/60 p-1.5 text-muted-foreground/90"
                  variant="outline"
                >
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent arrow={false} className="max-w-72 text-center" side="bottom">
                {t('Courses.reviewModeMessage')}
              </TooltipContent>
            </Tooltip>
          )}
          <span className="text-sm">
            {course.progress}
            {'%'}
          </span>
          <Progress className="md:max-w-sm" color={courseProgressColor} value={course.progress} />
        </div>

        {/* Content */}
        {currentLesson && (
          <div className="col-span-12 md:col-span-9">
            <div className="rounded-lg border bg-card p-8">
              {hasLessons ? (
                <>
                  <Markdown>{localize(currentLesson.content)}</Markdown>
                  {currentLesson.type === 'questions' && currentLesson.questions && (
                    <CourseQuestions
                      completed={currentLesson.completed}
                      onComplete={onQuestionAnswer}
                      questions={currentLesson.questions}
                    />
                  )}
                  {currentLesson.type === 'evaluations' && currentLesson.evaluations && (
                    <CourseEvaluations
                      completed={currentLesson.completed}
                      evaluations={currentLesson.evaluations}
                      onEvaluation={onEvaluation}
                    />
                  )}
                  {currentLesson.type === 'assessment' && currentLesson.assessment && (
                    <CourseAssessment
                      assessment={currentLesson.assessment}
                      completed={currentLesson.completed}
                      onValueChange={onAssessment}
                    />
                  )}
                </>
              ) : (
                <p>{'Create the first lesson'}</p>
              )}
            </div>

            {hasLessons && (
              <div className={cn('mt-6 flex', isFirstLesson ? 'justify-end' : 'justify-between')}>
                {!isFirstLesson && (
                  <Button className="gap-1" disabled={isFirstLesson} onClick={handlePrevious} variant="outline">
                    <ArrowLeftIcon className="h-4 w-4" />
                    {t('Common.previous')}
                  </Button>
                )}

                {isLastLesson ? (
                  canProceed ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        {course.status === 'completed' ? null : (
                          <ConfettiButton
                            className={cn('gap-1')}
                            disabled={!canProceed}
                            effect="fireworks"
                            onClick={handleNext}
                            options={{ zIndex: 100 }}
                            variant="outline"
                          >
                            {t('Courses.completeCourse')}
                          </ConfettiButton>
                        )}
                      </DialogTrigger>
                      <DialogContent className="px-8 sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle className="mt-3 flex gap-2 text-lg font-medium">
                            {completedTitle}
                            {' 🎉'}
                          </DialogTitle>
                        </DialogHeader>
                        <p className="mt-2 mb-1.5 text-[15px] text-foreground/80">{completedMessage}</p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">{t('Courses.reviewCourse')}</Button>
                          </DialogClose>
                          {completedCoursesCount < 3 && (
                            <Button asChild variant="outline">
                              <Link href={Route.Courses}>{t('Courses.backTo')}</Link>
                            </Button>
                          )}
                          {completedCoursesCount === config.minSkills && (
                            <Button asChild color="primary">
                              <Link href={Route.CertificateNew}>{t('Courses.requestCertificate')}</Link>
                            </Button>
                          )}
                          {completedCoursesCount > config.minSkills && (
                            <Button asChild variant="outline">
                              <Link href={Route.Certificates}>{t('Courses.goToCertificate')}</Link>
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="cursor-not-allowed gap-1" disabled variant="outline">
                          {t('Courses.completeCourse')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent arrow={false}>{nextTooltip}</TooltipContent>
                    </Tooltip>
                  )
                ) : canProceed ? (
                  <Button
                    className="gap-1"
                    onClick={() => handleNext()}
                    title={t('Courses.proceedToNextLesson')}
                    variant="outline"
                  >
                    {t('Common.next')}
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="cursor-not-allowed gap-1" disabled variant="outline">
                        {t('Common.next')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent arrow={false}>{nextTooltip}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
