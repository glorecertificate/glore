'use client'

import { useCallback, useMemo, useState } from 'react'

import { type IconName } from 'lucide-react/dynamic'
import { type Locale, useTranslations } from 'next-intl'
import { usePlateState } from 'platejs/react'
import { toast } from 'sonner'

import { type Enum } from '@glore/utils/types'

import { CourseContent } from '@/components/features/courses/course-content'
import { CourseFooter } from '@/components/features/courses/course-footer'
import { CourseHeader } from '@/components/features/courses/course-header'
import { CourseHeaderMobile } from '@/components/features/courses/course-header-mobile'
import { CourseInfo } from '@/components/features/courses/course-info'
import { CourseSidebar } from '@/components/features/courses/course-sidebar'
import { DynamicIcon } from '@/components/icons/dynamic'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { MotionTabs } from '@/components/ui/motion-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseProvider, createCourseProviderValue } from '@/hooks/use-course'
import { useHeader } from '@/hooks/use-header'
import { useIntl } from '@/hooks/use-intl'
import { useSearchParams } from '@/hooks/use-search-params'
import { useSession } from '@/hooks/use-session'
import { type Course, completeLesson, submitAnswers, submitAssessment, submitEvaluations } from '@/lib/data'
import { INTL_PLACEHOLDER } from '@/lib/intl'
import { type CourseMode } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const DEFAULT_COURSE: Partial<Course> = {
  type: 'skill',
  slug: '',
  title: INTL_PLACEHOLDER,
  description: INTL_PLACEHOLDER,
}

export const CourseView = (props: { course?: Course; defaultMode: CourseMode }) => {
  const searchParams = useSearchParams()
  const { locale, localeItems, localize } = useIntl()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const [_, setReadOnly] = usePlateState('readOnly')
  const [infoVisible, setInfoVisible] = useState(false)

  const isNew = useMemo(() => !props.course, [props.course])
  const hasLessons = useMemo(() => props.course?.lessons && props.course.lessons.length > 0, [props.course?.lessons])
  const initialCourse = useMemo(() => {
    if (isNew) return { ...DEFAULT_COURSE, lessons: [{}] } as Partial<Course>
    return (hasLessons ? props.course : { ...props.course, lessons: [{}] }) as Partial<Course>
  }, [hasLessons, isNew, props.course])

  const [course, setCourse] = useState<Partial<Course>>(initialCourse)

  const isArchived = useMemo(() => !!course.archivedAt, [course.archivedAt])
  const isDraft = useMemo(() => !isArchived && course.languages?.length === 0, [course.languages?.length, isArchived])
  const isPublished = useMemo(
    () => !isDraft && course.languages?.length === localeItems.length,
    [isDraft, course.languages?.length, localeItems.length]
  )
  const isPartial = useMemo(
    () => course.languages && course.languages.length > 0 && course.languages.length < localeItems.length,
    [course.languages, localeItems.length]
  )

  const [courseLocale, setLanguage] = useState<Locale>(() => {
    const param = searchParams.get<Locale>('lang')
    if (param && initialCourse.languages?.includes(param)) return param
    if (initialCourse.languages?.includes(locale)) return locale
    return (
      localeItems.filter(({ value }) => initialCourse.languages?.includes(value))[0]?.value ||
      locale ||
      initialCourse.languages?.[0] ||
      locale
    )
  })

  const language = useMemo(() => localeItems.find(item => item.value === courseLocale)!, [courseLocale, localeItems])

  useHeader(
    <BreadcrumbList className="sm:gap-1">
      <BreadcrumbLink href="/courses" title={t('backToAll')}>
        {t('courses')}
      </BreadcrumbLink>
      <BreadcrumbSeparator />
      <BreadcrumbItem className={cn('gap-1.5', course.title ? 'text-foreground/80' : 'text-muted')}>
        {course.icon && (
          <DynamicIcon
            className={cn(
              'size-4 shrink-0 stroke-muted-foreground/80',
              isPartial && 'stroke-warning',
              isPublished && 'stroke-success'
            )}
            name={course.icon as IconName}
            placeholder={Skeleton}
            placeholderProps={{ className: 'size-4 shrink-0' }}
          />
        )}
        {localize(course.title, courseLocale)}
        {user.canEdit && isDraft && <Badge size="xs">{t('draft')}</Badge>}
        {user.canEdit && isArchived && <Badge size="xs">{t('archived')}</Badge>}
      </BreadcrumbItem>
    </BreadcrumbList>,
    {
      shadow: false,
    }
  )

  const initialStep = useMemo(() => {
    if (!course.lessons || course.progress === 'completed') return 0
    const incompletedIndex = course.lessons?.findIndex(lesson => !lesson.completed)
    if (incompletedIndex !== -1) return incompletedIndex || 0
    return (course.lessons?.length || 0) - 1
  }, [course])

  const [mode, setModeState] = useState(props.defaultMode)
  const [step, setStepState] = useState(initialStep)
  const currentLesson = useMemo(() => (course.lessons ?? [])[step], [course.lessons, step])
  const isFirstLesson = useMemo(() => step === 0, [step])
  const isLastLesson = useMemo(() => step === (course.lessons?.length ?? 0) - 1, [step, course.lessons?.length])

  const setMode = useCallback(
    (mode: Enum<CourseMode>) => {
      setReadOnly(mode === 'preview')
      setModeState(mode as CourseMode)
    },
    [setReadOnly]
  )

  const setStep = useCallback((value: React.SetStateAction<number>) => {
    setStepState(value)
    setInfoVisible(false)
  }, [])

  const hasFooter = useMemo(() => course.lessons && course.lessons.length > 1, [course.lessons])

  const movePrevious = useCallback(() => {
    if (isFirstLesson) return
    setStep(i => i - 1)
  }, [isFirstLesson, setStep])

  const moveNext = useCallback(async () => {
    try {
      const lesson = currentLesson
      const index = step

      if (!isLastLesson) setStep(i => i + 1)
      if (course?.completed) return

      setCourse(course => ({
        ...course,
        lessons: course.lessons?.map((s, i) => (i === index ? { ...s, completed: true } : s)),
        progress: isLastLesson ? 'completed' : course.progress,
        completed: isLastLesson,
      }))

      if (lesson) await completeLesson(lesson.id)

      switch (lesson?.type) {
        case 'questions': {
          const options = lesson.questions?.flatMap(q => q.options.filter(o => o.isUserAnswer).map(o => ({ id: o.id })))
          if (!options || options.length === 0) return
          await submitAnswers(options)
          break
        }
        case 'evaluations': {
          if (!lesson.evaluations) return
          await submitEvaluations(lesson.evaluations.map(e => ({ id: e.id, value: e.userRating! })))
          break
        }
        case 'assessment': {
          const id = lesson.assessment?.id
          const value = lesson.assessment?.userRating
          if (!(id && value)) return
          await submitAssessment(id, value)
        }
      }
      setCourse(course)
    } catch (e) {
      toast.error(t('syncErrorMessage'), {
        dismissible: false,
        position: 'bottom-right',
      })
      console.error(e)
    }
  }, [course, currentLesson, isLastLesson, setStep, step, t])

  const courseContext = useMemo(
    () =>
      createCourseProviderValue(initialCourse, {
        course,
        infoVisible,
        language,
        lesson: currentLesson,
        mode,
        moveNext,
        movePrevious,
        setCourse,
        setInfoVisible,
        setLanguage,
        setMode,
        setStep,
        status: course.progress,
        step,
      }),
    [course, currentLesson, infoVisible, initialCourse, language, mode, moveNext, movePrevious, setMode, setStep, step]
  )

  return (
    <CourseProvider value={courseContext}>
      <MotionTabs onValueChange={v => setLanguage(v as Locale)} value={courseLocale}>
        <CourseHeader />
        <div className="grid grow grid-cols-1 gap-2 pb-8 md:grid-cols-[minmax(208px,1fr)_3fr]">
          <CourseSidebar />
          <div className="flex w-full min-w-0 flex-col">
            <CourseHeaderMobile />
            {infoVisible ? <CourseInfo /> : <CourseContent />}
            {hasFooter && <CourseFooter />}
          </div>
        </div>
      </MotionTabs>
    </CourseProvider>
  )
}
