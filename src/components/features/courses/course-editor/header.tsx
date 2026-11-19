'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { createPortal } from 'react-dom'

import { CourseDialog } from '@/components/features/courses/course-dialog'
import { CourseAnalyticsSheet } from '@/components/features/courses/course-editor/analytics'
import { CourseBarTitle } from '@/components/features/courses/course-editor/bar-title'
import { normalizeContent, useCourse } from '@/components/features/courses/course-editor/context'
import { CourseHeading } from '@/components/features/courses/course-editor/heading'
import { type QuizIssue, raiseQuizIssue } from '@/components/features/courses/course-editor/quiz-issue'
import { LucideIcon } from '@/components/icons/lucide'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { useI18n } from '@/components/providers/i18n'
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
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMounted } from '@/hooks/use-mounted'
import { COURSE_TITLE_MAX_LENGTH } from '@/lib/constants'
import { type IntlRecord } from '@/lib/i18n'
import { isTempId } from '@/lib/utils'

const CourseMenu = ({
  onAnalytics,
  onSettings,
  onUnpublish,
}: {
  onAnalytics: () => void
  onSettings: () => void
  onUnpublish: (() => void) | null
}) => {
  const t = useTranslations('CourseEditor')
  const tCourseCommon = useTranslations('CourseCommon')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t('moreActions')} size="icon" variant="band-secondary">
          <LucideIcon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onSelect={onSettings}>
          <LucideIcon aria-hidden name="settings" />
          {tCourseCommon('settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onAnalytics}>
          <LucideIcon aria-hidden name="chart-no-axes-column" />
          {t('analyticsSheet')}
        </DropdownMenuItem>
        {onUnpublish && (
          <DropdownMenuItem onSelect={onUnpublish}>
            <LucideIcon aria-hidden name="eye-off" />
            {t('unpublish')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const CourseHeader = () => {
  const { replace } = useRouter()
  const { localeItems } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('CourseEditor')
  const tCourseCommon = useTranslations('CourseCommon')
  const tEditor = useTranslations('Learning.editor')
  const { course, language, languageStatus, saveCourse, setStep, status, step } = useCourse()
  const [incompleteAlertOpen, setIncompleteAlertOpen] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [failed, setFailed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const mounted = useMounted()
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const alertResolverRef = useRef<((value: boolean) => void) | null>(null)

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

  const publishedLanguageCount = localeItems.filter(({ value }) => status[value].published).length

  const isPublished = languageStatus.published
  const primaryDisabled = isPublished && !languageStatus.hasUpdates
  const draftDisabled = !languageStatus.hasUpdates

  const stateText = (() => {
    if (saving) return { text: t('saving'), tone: 'neutral' } as const
    if (failed) return { text: t('saveFailedShort'), tone: 'danger' } as const
    if (languageStatus.hasUpdates) return { text: t('unsavedChanges'), tone: 'warning' } as const
    if (justSaved) return { text: t('savedJustNow'), tone: 'success' } as const
    return null
  })()

  const validateQuiz = (): { issue: QuizIssue; lessonIndex: number; message: string } | null => {
    for (const [lessonIndex, lesson] of course.lessons.entries()) {
      const position = lessonIndex + 1
      const title = lesson.title?.[language] || t('untitledLesson')
      for (const [index, question] of (lesson.questions ?? []).entries()) {
        const values = { number: index + 1, position, title }
        const questionId = question.id
        if (!((question.description as IntlRecord)?.[language] ?? '').trim()) {
          return { issue: { questionId, target: 'question' }, lessonIndex, message: t('quizQuestionEmpty', values) }
        }
        if (question.options.length < 2) {
          return { issue: { questionId, target: 'options' }, lessonIndex, message: t('quizMinOptions', values) }
        }
        const empty = question.options.find(option => !((option.content as IntlRecord)?.[language] ?? '').trim())
        if (empty) {
          return {
            issue: { optionId: empty.id, questionId, target: 'option' },
            lessonIndex,
            message: t('quizOptionEmpty', values),
          }
        }
        if (!question.options.some(option => option.isCorrect)) {
          return { issue: { questionId, target: 'correct' }, lessonIndex, message: t('quizNoCorrect', values) }
        }
      }
    }
    return null
  }

  const handleSave = async (publish: boolean | null) => {
    const quiz = validateQuiz()
    if (quiz) {
      toast.error(quiz.message)
      if (quiz.lessonIndex !== step - 1) setStep(quiz.lessonIndex + 1)
      raiseQuizIssue(quiz.issue)
      return
    }
    if (publish === true && !languageStatus.hasContent) {
      const confirmed = await new Promise<boolean>(resolve => {
        alertResolverRef.current = resolve
        setIncompleteAlertOpen(true)
      })
      if (!confirmed) return
    }
    try {
      setSaving(publish === null && !isPublished ? 'draft' : 'publish')
      setJustSaved(false)
      setFailed(false)
      await saveCourse({ locale: language, publish })
      setJustSaved(true)
      toast.success(t('saveSuccess'))
    } catch (error) {
      const code = (error as { code?: string } | null)?.code
      const errorMessage = () => {
        if (code === 'DESCRIPTIONS_MISSING') return tEditor('publishDescriptionsMissing')
        if (code === 'TITLE_TOO_LONG') return t('titleTooLong', { max: COURSE_TITLE_MAX_LENGTH })
        return t('saveError')
      }
      setFailed(true)
      toast.error(errorMessage())
    } finally {
      setSaving(null)
    }
  }

  const onPrimary = () => handleSave(isPublished ? null : true)
  const onSaveDraft = () => handleSave(null)
  const onUnpublish = () => handleSave(false)

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
    <>
      <CourseHeading>
        {({ counter, description, icon, title }) => (
          <DashboardHeader
            breadcrumb={
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-band-text">
                  {icon}
                  <StatusBadge tone={languageStatus.published ? 'success' : 'neutral'}>
                    {languageStatus.published ? t('publishSwitchPublished') : t('publishSwitchDraft')}
                  </StatusBadge>
                  <span>{t('visibleLanguages', { count: publishedLanguageCount })}</span>
                  <span className="max-md:hidden">{t('lessonsCount', { count: course.lessons.length })}</span>
                  {counter}
                  <div className="ml-auto flex items-center gap-2 max-md:hidden">
                    <span aria-live="polite" className="text-sm text-band-text">
                      {stateText && <StatusBadge tone={stateText.tone}>{stateText.text}</StatusBadge>}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button aria-label={tEditor('previewAsLearner')} asChild size="icon" variant="band-secondary">
                          <Link href={previewHref}>
                            <LucideIcon name="eye" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tEditor('previewAsLearner')}</TooltipContent>
                    </Tooltip>
                    <CourseMenu
                      onAnalytics={() => setAnalyticsOpen(true)}
                      onSettings={() => setSettingsOpen(true)}
                      onUnpublish={isPublished ? onUnpublish : null}
                    />
                    {!isPublished && (
                      <Button
                        disabled={draftDisabled || saving !== null}
                        loading={saving === 'draft'}
                        onClick={onSaveDraft}
                        variant="band-secondary"
                      >
                        {t('saveDraft')}
                      </Button>
                    )}
                    {primaryDisabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button disabled variant="band">
                              {t('publishChanges')}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('noChangesToPublish')}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        disabled={saving !== null}
                        loading={saving === 'publish'}
                        onClick={onPrimary}
                        variant="band"
                      >
                        {isPublished ? t('publishChanges') : t('publish')}
                      </Button>
                    )}
                  </div>
                  <div className="ml-auto md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-label={t('moreActions')} size="icon" variant="band-secondary">
                          <LucideIcon name="ellipsis" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-56">
                        <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                          <LucideIcon aria-hidden name="settings" />
                          {tCourseCommon('settings')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAnalyticsOpen(true)}>
                          <LucideIcon aria-hidden name="chart-no-axes-column" />
                          {t('analyticsSheet')}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={previewHref}>
                            <LucideIcon aria-hidden name="eye" />
                            {tEditor('previewAsLearner')}
                          </Link>
                        </DropdownMenuItem>
                        {isPublished && (
                          <DropdownMenuItem onSelect={onUnpublish}>
                            <LucideIcon aria-hidden name="eye-off" />
                            {t('unpublish')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            }
            description={description}
            heading={title}
            parent="courses"
            title={<CourseBarTitle />}
          />
        )}
      </CourseHeading>
      <CourseDialog
        course={course}
        onOpenChange={setSettingsOpen}
        onSuccess={updated => {
          if (updated.slug !== course.slug) {
            replace(`/courses/${updated.slug}?lesson=${step}&lang=${language}`)
          }
        }}
        open={settingsOpen}
      />
      <CourseAnalyticsSheet onOpenChange={setAnalyticsOpen} open={analyticsOpen} />
      {mounted &&
        createPortal(
          <section
            aria-label={t('saveBarLabel')}
            className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-page pt-2 pb-bar-safe backdrop-blur-sm md:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <span aria-live="polite" className="min-w-0 truncate text-sm text-muted-foreground">
                {stateText && <StatusBadge tone={stateText.tone}>{stateText.text}</StatusBadge>}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {!isPublished && (
                  <Button
                    disabled={draftDisabled || saving !== null}
                    loading={saving === 'draft'}
                    onClick={onSaveDraft}
                    variant="outline"
                  >
                    {t('saveDraft')}
                  </Button>
                )}
                <Button
                  disabled={primaryDisabled || saving !== null}
                  loading={saving === 'publish'}
                  onClick={onPrimary}
                  variant="brand"
                >
                  {isPublished ? t('publishChanges') : t('publish')}
                </Button>
              </div>
            </div>
          </section>,
          document.body
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
    </>
  )
}
