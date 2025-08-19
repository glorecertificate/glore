'use client'

import { useCallback, useMemo, useState } from 'react'

import { type IconName } from 'lucide-react/dynamic'
import { usePlateState } from 'platejs/react'
import { toast } from 'sonner'
import { type Locale } from 'use-intl'

import { log } from '@repo/utils/logger'
import { pick } from '@repo/utils/pick'

import { CourseContent } from '@/components/features/courses/course-content'
import { CourseFooter } from '@/components/features/courses/course-footer'
import { CourseHeader } from '@/components/features/courses/course-header'
import { CourseHeaderMobile } from '@/components/features/courses/course-header-mobile'
import { CourseInfo } from '@/components/features/courses/course-info'
import { CourseSidebar } from '@/components/features/courses/course-sidebar'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { DynamicIcon } from '@/components/ui/icons/dynamic'
import { MotionTabs } from '@/components/ui/motion-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { useHeader } from '@/hooks/use-header'
import { useLocale } from '@/hooks/use-locale'
import { useQueryParams } from '@/hooks/use-query-params'
import { useSession } from '@/hooks/use-session'
import { useSyncState } from '@/hooks/use-sync-state'
import { useTranslations } from '@/hooks/use-translations'
import { type Course } from '@/lib/api/courses/types'
import { Route } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const COURSE_VIEW_TABS = ['info', 'editor', 'preview'] as const

export type CourseViewTab = (typeof COURSE_VIEW_TABS)[number]

export const CourseView = (props: { course?: Course }) => {
  const api = useApi()
  const { locale, localeItems, localize } = useLocale()
  const [readOnly, setReadOnly] = usePlateState('readOnly')
  const { queryParams, setQueryParam } = useQueryParams()
  const { courses, setCourses, user } = useSession()
  const { setSyncState } = useSyncState()
  const t = useTranslations('Courses')

  const isNew = useMemo(() => !props.course, [props.course])
  const hasLessons = useMemo(() => props.course?.lessons && props.course.lessons.length > 0, [props.course?.lessons])
  const initialCourse = useMemo(() => {
    if (isNew) return { lessons: [{}] } as Partial<Course>
    return (hasLessons ? props.course : { ...props.course, lessons: [{}] }) as Partial<Course>
  }, [hasLessons, isNew, props.course])

  const [course, setCourse] = useState<Partial<Course>>(initialCourse)

  const updateCourse = useCallback(
    (updater: (course: Course) => Course) => {
      setCourses(courses.map(m => (m.id === course.id ? updater(m) : m)))
    },
    [course.id, setCourses, courses],
  )

  const publishedLocales = useMemo(() => course?.publishedLocales ?? [], [course.publishedLocales])
  const draftLocales = useMemo(() => course?.draftLocales ?? [], [course.draftLocales])

  const isArchived = useMemo(() => !!course.archivedAt, [course.archivedAt])
  const isDraft = useMemo(() => !isArchived && publishedLocales.length === 0, [isArchived, publishedLocales.length])
  const isPublished = useMemo(
    () => !isDraft && publishedLocales.length === localeItems.length,
    [isDraft, publishedLocales.length, localeItems.length],
  )
  const isPartial = useMemo(
    () => !isDraft && !isPublished && publishedLocales.length > 0,
    [isDraft, isPublished, publishedLocales.length],
  )

  const initialLanguage = useMemo(() => {
    const param = queryParams.get('lang') as Locale | null
    const locales = [...publishedLocales, ...draftLocales]
    if (param && locales.includes(param)) return param
    if (locales.includes(locale)) return locale
    return localeItems.filter(({ value }) => locales.includes(value))[0]?.value || locale || locales[0]
  }, [queryParams, publishedLocales, draftLocales, locale, localeItems])

  const [language, setLanguageState] = useState<Locale>(initialLanguage)

  const setLanguage = useCallback(
    (lang: Locale) => {
      setLanguageState(lang)
      setQueryParam('lang', lang)
    },
    [setQueryParam],
  )

  useHeader({
    shadow: false,
    header: (
      <BreadcrumbList className="sm:gap-1">
        <BreadcrumbLink href={Route.Courses} title={t('backToAll')}>
          {t('courses')}
        </BreadcrumbLink>
        <BreadcrumbSeparator />
        <BreadcrumbItem className={cn('gap-1.5', course.title ? 'text-foreground/80' : 'text-muted')}>
          {course.icon && (
            <DynamicIcon
              className={cn(
                'size-4 shrink-0 stroke-muted-foreground/80',
                isPartial && 'stroke-warning',
                isPublished && 'stroke-success',
              )}
              name={course.icon as IconName}
              placeholder={Skeleton}
              placeholderProps={{ className: 'size-4 shrink-0' }}
            />
          )}
          {localize(course.title, language)}
          {user.canEdit && isDraft && <Badge size="xs">{t('draft')}</Badge>}
          {user.canEdit && isArchived && <Badge size="xs">{t('archived')}</Badge>}
        </BreadcrumbItem>
      </BreadcrumbList>
    ),
  })

  const initialStep = useMemo(() => {
    if (!course.lessons || course.progress === 'completed') return 0
    const incompletedIndex = course.lessons?.findIndex(lesson => !lesson.completed)
    if (incompletedIndex !== -1) return incompletedIndex || 0
    return (course.lessons?.length || 0) - 1
  }, [course])

  const [step, setStep] = useState(initialStep)
  const currentLesson = useMemo(() => course.lessons![step], [course.lessons, step])
  const isFirstLesson = useMemo(() => step === 0, [step])
  const isLastLesson = useMemo(() => step === (course.lessons?.length ?? 0) - 1, [step, course.lessons?.length])

  const [tab, setTab] = useState<CourseViewTab>(user.canEdit ? (isNew ? 'info' : 'editor') : 'preview')

  const onTabChange = useCallback(
    (value: string) => {
      const tab = value as CourseViewTab
      if (tab === 'editor') setReadOnly(false)
      if (tab === 'preview') setReadOnly(true)
      setTab(tab)
    },
    [setReadOnly],
  )

  const isPreview = useMemo(() => !user.canEdit || !!readOnly, [user.canEdit, readOnly])

  const hasFooter = useMemo(() => course.lessons && course.lessons.length > 1, [course.lessons])

  const handlePrevious = useCallback(() => {
    if (isFirstLesson) return
    setStep(i => i - 1)
  }, [isFirstLesson, setStep])

  const handleNext = useCallback(async () => {
    try {
      const lesson = currentLesson
      const index = step

      if (!isLastLesson) setStep(i => i + 1)
      if (course?.completed) return

      updateCourse(course => ({
        ...course,
        lessons: course.lessons?.map((s, i) => (i === index ? { ...s, completed: true } : s)),
        progress: isLastLesson ? 'completed' : course.progress,
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
      setCourse(course)
      setSyncState('complete')
    } catch (e) {
      toast.error(t('syncErrorMessage'), {
        dismissible: false,
        position: 'bottom-right',
      })
      setSyncState('error')
      log.error(e)
    }
  }, [currentLesson, step, isLastLesson, updateCourse, course, api.courses, setSyncState, t])

  return (
    <>
      <MotionTabs className="h-full" defaultValue="all" onValueChange={onTabChange} value={tab}>
        <CourseHeader
          course={course}
          language={language}
          setLanguage={setLanguage}
          step={step}
          updater={updateCourse}
        />
        <div className="grid grid-cols-1 gap-2 pb-8 md:grid-cols-[minmax(208px,1fr)_3fr]">
          <CourseSidebar course={course} language={language} setStep={setStep} step={step} />

          <div className="flex w-full min-w-0 flex-col">
            <CourseHeaderMobile course={course} language={language} setStep={setStep} step={step} />

            {tab === 'info' ? (
              <CourseInfo course={course} language={language} />
            ) : (
              <>
                <CourseContent
                  language={language}
                  lesson={currentLesson}
                  preview={isPreview}
                  setCourse={updateCourse}
                  step={step}
                />
                {hasFooter && (
                  <CourseFooter
                    lessons={course.lessons}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    status={course.progress}
                    step={step}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </MotionTabs>
    </>
  )
}
