'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { CourseDialog } from '@/components/features/courses/course-dialog'
import { CourseAnalyticsSheet } from '@/components/features/courses/course-editor/analytics'
import { normalizeContent, useCourse } from '@/components/features/courses/course-editor/context'
import { PublishSwitch } from '@/components/features/courses/course-editor/publish-switch'
import { CourseTranslation } from '@/components/features/courses/course-editor/translation'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { computeTranslationCoverage } from '@/db/queries/course-editing'
import { type Lesson } from '@/db/queries/lesson'
import { useScroll } from '@/hooks/use-scroll'
import { type IntlRecord, localizeRecord } from '@/lib/i18n'
import { cn, isTempId } from '@/lib/utils'

export const CourseHeader = () => {
  const { replace } = useRouter()
  const { scrolled } = useScroll()
  const { localeItems } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('CourseEditor')
  const tCourseCommon = useTranslations('CourseCommon')
  const tList = useTranslations('CourseList')
  const tEditor = useTranslations('Learning.editor')
  const { user } = useSession()
  const { course, language, languageStatus, status, step, saveCourse } = useCourse()
  const [incompleteAlertOpen, setIncompleteAlertOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState(languageStatus.published)
  const [saving, setSaving] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prevLanguageRef = useRef(language)
  const alertResolverRef = useRef<((value: boolean) => void) | null>(null)

  if (prevLanguageRef.current !== language) {
    prevLanguageRef.current = language
    setPublishTarget(languageStatus.published)
  }

  const progressColor = course.progress === 100 ? 'success' : 'default'
  const coverage = computeTranslationCoverage(course)
  const previewLesson = course.lessons[step - 1]
  const previewHref =
    previewLesson && !isTempId(previewLesson.id)
      ? (`/courses/${course.slug}/learn?lang=${language}&lesson=${previewLesson.id}` as const)
      : (`/courses/${course.slug}/learn?lang=${language}` as const)

  const incompleteLessons = course.lessons.reduce<number[]>((acc, lesson, i) => {
    const title = lesson.title?.[language]
    const content = (lesson.content as IntlRecord)?.[language]
    if (!normalizeContent(title) || !normalizeContent(content)) acc.push(i + 1)
    return acc
  }, [])

  const publishedLanguageCount = localeItems.filter(({ value }) =>
    value === language ? publishTarget : status[value].published
  ).length

  const saveDisabled = !languageStatus.hasUpdates && publishTarget === languageStatus.published

  const validateQuiz = () => {
    for (const [lessonIndex, lesson] of course.lessons.entries()) {
      const position = lessonIndex + 1
      const title = lesson.title?.[language] || t('untitledLesson')
      for (const [index, question] of (lesson.questions ?? []).entries()) {
        const values = { number: index + 1, position, title }
        if (!((question.description as IntlRecord)?.[language] ?? '').trim()) return t('quizQuestionEmpty', values)
        if (question.options.length < 2) return t('quizMinOptions', values)
        if (question.options.some(option => !((option.content as IntlRecord)?.[language] ?? '').trim())) {
          return t('quizOptionEmpty', values)
        }
        if (!question.options.some(option => option.isCorrect)) return t('quizNoCorrect', values)
      }
    }
    return null
  }

  const handleSave = async () => {
    if (saveDisabled) return
    const quizError = validateQuiz()
    if (quizError) {
      toast.error(quizError)
      return
    }
    const publish =
      publishTarget && !languageStatus.published ? true : !publishTarget && languageStatus.published ? false : null
    if (publish === true && !languageStatus.hasContent) {
      const confirmed = await new Promise<boolean>(resolve => {
        alertResolverRef.current = resolve
        setIncompleteAlertOpen(true)
      })
      if (!confirmed) {
        setPublishTarget(languageStatus.published)
        return
      }
    }
    try {
      setSaving(true)
      await saveCourse({ locale: language, publish })
      toast.success(t('saveSuccess'))
    } catch {
      toast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleAlertCancel = () => {
    alertResolverRef.current?.(false)
    alertResolverRef.current = null
    setIncompleteAlertOpen(false)
  }

  const handleAlertConfirm = () => {
    alertResolverRef.current?.(true)
    alertResolverRef.current = null
    setIncompleteAlertOpen(false)
  }

  return (
    <div
      className={cn(
        'z-50 flex w-full flex-wrap items-center justify-between gap-2 bg-background px-1 pt-1 pb-4 md:sticky md:top-16 md:flex-nowrap',
        !user.canEdit && 'max-md:hidden',
        scrolled && 'border-b'
      )}
    >
      {user.canEdit ? (
        <>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            <div className="flex gap-1.5">
              <CourseDialog
                course={course}
                onOpenChange={setSettingsOpen}
                onSuccess={updated => {
                  if (updated.slug !== course.slug) {
                    replace(`/courses/${updated.slug}?lesson=${step}&lang=${language}`)
                  }
                }}
                open={settingsOpen}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button aria-label={tCourseCommon('settings')} size="xs" variant="outline">
                        <LucideIcon name="settings" className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center" sideOffset={6}>
                    {tCourseCommon('settings')}
                  </TooltipContent>
                </Tooltip>
              </CourseDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button aria-label={tEditor('previewAsLearner')} asChild size="xs" variant="outline">
                    <Link href={previewHref}>
                      <LucideIcon className="size-4" name="eye" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72 text-center" sideOffset={6}>
                  {tEditor('previewHint')}
                </TooltipContent>
              </Tooltip>
              <CourseAnalyticsSheet />
            </div>
            <TabsList className="h-8 w-full min-w-0 scrollbar-none justify-start overflow-x-auto sm:w-fit sm:justify-center">
              {localeItems.map(({ label, icon, value }) => {
                const isPublished = status[value].published
                return (
                  <TabsTrigger
                    className={cn(
                      'relative flex',
                      status[value].hasUpdates && 'text-warning-text/70 data-[state=active]:text-warning-text!'
                    )}
                    key={value}
                    size="sm"
                    value={value}
                  >
                    <span className="flex items-center group-data-[status=inactive]/tabs-trigger:opacity-60 group-data-[status=inactive]/tabs-trigger:grayscale-40">
                      <span
                        aria-hidden
                        className={cn(
                          'relative mr-1.5 inline-block size-1.5 rounded-full align-middle',
                          isPublished ? 'bg-success' : 'bg-muted-foreground/40'
                        )}
                      >
                        {isPublished && (
                          <span className="absolute inset-0 z-0 animate-ping rounded-full bg-success opacity-60" />
                        )}
                      </span>
                      <span className="flex items-center justify-between gap-1">
                        {label} <span className="max-sm:hidden">{icon}</span>
                      </span>
                      <span
                        className="ml-1.5 text-[10px] text-muted-foreground tabular-nums group-data-[state=active]/tabs-trigger:text-stroke group-data-[state=inactive]/tabs-trigger:opacity-70 max-sm:sr-only"
                        title={tEditor('coverage', {
                          done: coverage[value].done,
                          language: label,
                          total: coverage[value].total,
                        })}
                      >
                        {`${coverage[value].percent}%`}
                      </span>
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            <PublishSwitch
              disabled={saving}
              languageCount={publishedLanguageCount}
              onToggle={() => setPublishTarget(!publishTarget)}
              published={publishTarget}
            />
            <CourseTranslation />
          </div>
          <div className="flex w-full items-center gap-3 md:w-auto">
            {saveDisabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      className="w-full transition-none md:w-auto"
                      disabled
                      icon="save"
                      loading={saving}
                      spinner="size-4"
                      variant="brand"
                    >
                      {t('save')}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('nothingToSave')}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                className="w-full transition-none md:w-auto"
                icon="save"
                loading={saving}
                onClick={handleSave}
                spinner="size-4"
                variant="brand"
              >
                {t('save')}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex h-full items-center gap-2">
            <span className="pt-1 text-sm text-muted-foreground">
              {t('lessonCount', {
                count: String(step),
                total: String(course.lessons?.length || 0),
              })}
            </span>
          </div>
          {user.isLearner && (
            <>
              {course.progressStatus === 'completed' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className="mr-2 cursor-help rounded-full border-muted-foreground/60 p-1.5 text-muted-foreground/90"
                      variant="outline"
                    >
                      <LucideIcon name="eye" className="size-4 text-muted-foreground" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center" side="bottom">
                    {t('reviewModeMessage')}
                  </TooltipContent>
                </Tooltip>
              )}
              <span className="text-sm">
                {course.progress}
                {'%'}
              </span>
              <Progress
                aria-label={tList('completed')}
                className="md:max-w-sm"
                color={progressColor}
                value={course.progress}
              />
            </>
          )}
        </>
      )}
      <AlertDialog onOpenChange={open => !open && handleAlertCancel()} open={incompleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('publishIncompleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('publishIncompleteMessage', {
                count: incompleteLessons.length,
                lessons: incompleteLessons.join(', '),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAlertCancel} variant="outline">
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm} variant="brand">
              {t('publishAnyway')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export const CourseHeaderMobile = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { course, currentLesson, language, setStep, step } = useCourse()
  const { scrolled } = useScroll()
  const t = useTranslations('CourseEditor')
  const tList = useTranslations('CourseList')

  const progressColor = course.progress === 100 ? 'success' : 'default'
  const lessonType = (lesson: Lesson) => t('lessonType', { type: lesson.type })
  const isCurrentLesson = (index: number) => index === step
  const isCompletedLesson = (index: number) => course.lessons[index].completed

  return (
    <div className={cn('flex flex-col gap-4 bg-background pb-4', scrolled && 'border-b', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between py-6" variant="outline">
            <div className="flex flex-col items-start">
              {currentLesson ? (
                <>
                  {currentLesson.title && (
                    <span className="font-medium">{localizeRecord(currentLesson.title, language)}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{lessonType(currentLesson)}</span>
                </>
              ) : (
                <span className="font-medium">{t('noLessons')}</span>
              )}
            </div>
            <LucideIcon name="chevron-down" className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {course.lessons.length > 0 ? (
            course.lessons.map((lesson, index) => (
              <DropdownMenuItem
                className="flex justify-between py-2"
                key={lesson.id}
                onClick={() => setStep(index + 1)}
              >
                <div className="flex flex-col">
                  <span className={cn(isCurrentLesson(index) && 'font-semibold')}>
                    {lesson.title && localizeRecord(lesson.title, language)}{' '}
                    {isCompletedLesson(index) && <span className="ml-1 text-xs text-success-text">{'✔︎'}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{lessonType(lesson)}</span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem className="flex justify-between py-2">
              <div className="flex flex-col">
                <span>{t('addLesson')}</span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {course.progressStatus !== 'completed' && (
        <div className="flex items-center justify-end gap-2 bg-background md:top-18">
          <span className="text-sm">
            {course.progress}
            {'%'}
          </span>
          <Progress
            aria-label={tList('completed')}
            className="md:max-w-sm"
            color={progressColor}
            value={course.progress}
          />
        </div>
      )}
    </div>
  )
}
