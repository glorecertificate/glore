'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { ChevronDownIcon, EyeIcon, InfoIcon, SaveIcon, SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { CourseDialog } from '@/components/features/courses/course-dialog'
import { CourseAnalyticsSheet } from '@/components/features/courses/course-editor/analytics'
import { normalizeContent, useCourse } from '@/components/features/courses/course-editor/context'
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
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Lesson } from '@/db/queries/lesson'
import { useScroll } from '@/hooks/use-scroll'
import { type IntlRecord, localizeRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const CourseHeader = () => {
  const { replace } = useRouter()
  const { scrolled } = useScroll()
  const { localeItems } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')
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

  const incompleteLessons = course.lessons.reduce<number[]>((acc, lesson, i) => {
    const title = lesson.title?.[language]
    const content = (lesson.content as IntlRecord)?.[language]
    if (!normalizeContent(title) || !normalizeContent(content)) acc.push(i + 1)
    return acc
  }, [])

  const isSaveDisabled = !languageStatus.hasUpdates && publishTarget === languageStatus.published

  const validateQuiz = () => {
    for (const lesson of course.lessons) {
      for (const [index, question] of (lesson.questions ?? []).entries()) {
        const number = index + 1
        if (!((question.description as IntlRecord)?.[language] ?? '').trim()) return t('quizQuestionEmpty', { number })
        if (question.options.length < 2) return t('quizMinOptions', { number })
        if (question.options.some(option => !((option.content as IntlRecord)?.[language] ?? '').trim())) {
          return t('quizOptionEmpty', { number })
        }
        if (!question.options.some(option => option.isCorrect)) return t('quizNoCorrect', { number })
      }
    }
    return null
  }

  const handleSave = async () => {
    if (isSaveDisabled) return
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
        'sticky top-36 z-50 hidden w-full items-center justify-between gap-2 bg-background px-1 pt-1 pb-4 md:top-16 md:flex',
        scrolled && 'border-b'
      )}
    >
      {user.canEdit ? (
        <>
          <div className="flex items-center gap-2">
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
                      <Button size="xs" variant="outline">
                        <SettingsIcon className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center" sideOffset={6}>
                    {t('settings')}
                  </TooltipContent>
                </Tooltip>
              </CourseDialog>
              <CourseAnalyticsSheet />
            </div>
            <TabsList className="h-8 w-full sm:w-fit">
              {localeItems.map(({ label, icon, value }) => {
                const isPublished = status[value].published
                return (
                  <TabsTrigger
                    className={cn('relative flex', status[value].hasUpdates && 'text-yellow-600!')}
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
                      <span className="flex items-center justify-between">
                        {label} {icon}
                      </span>
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          <div className="flex items-center gap-3">
            {isSaveDisabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      className="transition-none"
                      disabled
                      icon={SaveIcon}
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
                className="transition-none"
                icon={SaveIcon}
                loading={saving}
                onClick={handleSave}
                spinner="size-4"
                variant="brand"
              >
                {t('save')}
              </Button>
            )}
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 py-1 pr-2 pl-3 transition-colors">
              <label
                className="flex cursor-pointer items-center gap-1.5 text-sm font-medium select-none"
                htmlFor="publish-toggle"
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full transition-colors',
                    publishTarget ? 'bg-success' : 'bg-muted-foreground/40'
                  )}
                />
                {t('publishToggleLabel')}
              </label>
              <Switch
                checked={publishTarget}
                className="data-[state=checked]:bg-success"
                disabled={saving}
                id="publish-toggle"
                onCheckedChange={setPublishTarget}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-3.5 cursor-help text-muted-foreground transition-colors hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-center" sideOffset={8}>
                  {t('publishInfo')}
                </TooltipContent>
              </Tooltip>
            </div>
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
                      <EyeIcon className="size-4 text-muted-foreground" />
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
              <Progress className="md:max-w-sm" color={progressColor} value={course.progress} />
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
  const t = useTranslations('Courses')

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
                <span className="font-medium">{'No lessons'}</span>
              )}
            </div>
            <ChevronDownIcon className="size-4 opacity-50" />
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
                    {isCompletedLesson(index) && <span className="ml-1 text-xs text-success">{'✔︎'}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{lessonType(lesson)}</span>
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
      {course.progressStatus !== 'completed' && (
        <div className="flex items-center justify-end gap-2 bg-background md:top-18">
          <span className="text-sm">
            {course.progress}
            {'%'}
          </span>
          <Progress className="md:max-w-sm" color={progressColor} value={course.progress} />
        </div>
      )}
    </div>
  )
}
