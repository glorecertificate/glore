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
import { CourseLanguageTabs } from '@/components/features/courses/course-editor/language-tabs'
import { PublishControl } from '@/components/features/courses/course-editor/publish-control'
import { CourseTranslation } from '@/components/features/courses/course-editor/translation'
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
import { DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMounted } from '@/hooks/use-mounted'
import { COURSE_TITLE_MAX_LENGTH } from '@/lib/constants'
import { type IntlRecord } from '@/lib/i18n'
import { isTempId } from '@/lib/utils'

export const CourseHeader = () => {
  const { replace } = useRouter()
  const { localeItems } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('CourseEditor')
  const tCourseCommon = useTranslations('CourseCommon')
  const tEditor = useTranslations('Learning.editor')
  const { course, language, languageStatus, status, step, saveCourse } = useCourse()
  const [incompleteAlertOpen, setIncompleteAlertOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState(languageStatus.published)
  const [saving, setSaving] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const mounted = useMounted()
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const prevLanguageRef = useRef(language)
  const alertResolverRef = useRef<((value: boolean) => void) | null>(null)

  if (prevLanguageRef.current !== language) {
    prevLanguageRef.current = language
    setPublishTarget(languageStatus.published)
  }

  const languageLabel = localeItems.find(item => item.value === language)?.displayLabel ?? language
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
    } catch (error) {
      const code = (error as { code?: string } | null)?.code
      const errorMessage = () => {
        if (code === 'DESCRIPTIONS_MISSING') return tEditor('publishDescriptionsMissing')
        if (code === 'TITLE_TOO_LONG') return t('titleTooLong', { max: COURSE_TITLE_MAX_LENGTH })
        return t('saveError')
      }
      toast.error(errorMessage())
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
    <>
      <CourseHeading>
        {({ counter, description, icon, title }) => (
          <DashboardHeader
            actions={
              <div className="contents max-md:hidden">
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
                        <Button aria-label={tCourseCommon('settings')} size="icon" variant="band-secondary">
                          <LucideIcon name="settings" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{tCourseCommon('settings')}</TooltipContent>
                  </Tooltip>
                </CourseDialog>
                <CourseAnalyticsSheet />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="band-secondary">
                      <Link href={previewHref}>
                        <LucideIcon name="eye" />
                        {tEditor('previewAsLearner')}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 text-center">{tEditor('previewHint')}</TooltipContent>
                </Tooltip>
                <PublishControl
                  disabled={saving}
                  language={languageLabel}
                  onChange={setPublishTarget}
                  published={publishTarget}
                />
                {saveDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button disabled icon="save" variant="band">
                          {t('save')}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{t('nothingToSave')}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button icon="save" loading={saving} onClick={handleSave} variant="band">
                    {t('save')}
                  </Button>
                )}
                {saveDisabled && (
                  <span className="hidden basis-full text-right text-xs text-band-text pointer-coarse:block">
                    {t('nothingToSave')}
                  </span>
                )}
              </div>
            }
            breadcrumb={
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-band-text">
                  {icon}
                  <StatusBadge
                    icon={languageStatus.published ? 'circle-check' : 'circle-dashed'}
                    tone={languageStatus.published ? 'success' : 'neutral'}
                  >
                    {languageStatus.published ? t('publishSwitchPublished') : t('publishSwitchDraft')}
                  </StatusBadge>
                  {languageStatus.hasUpdates && (
                    <StatusBadge icon="pencil" tone="warning">
                      {t('unsavedChanges')}
                    </StatusBadge>
                  )}
                  <span>{t('visibleLanguages', { count: publishedLanguageCount })}</span>
                  <span className="max-md:hidden">{t('lessonsCount', { count: course.lessons.length })}</span>
                  {counter}
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <CourseAnalyticsSheet onOpenChange={setAnalyticsOpen} open={analyticsOpen} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CourseLanguageTabs />
                  <CourseTranslation />
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
      {mounted &&
        createPortal(
          <section
            aria-label={t('saveBarLabel')}
            className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-page pt-2 pb-bar-safe backdrop-blur-sm md:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <PublishControl
                disabled={saving}
                language={languageLabel}
                onChange={setPublishTarget}
                published={publishTarget}
                tone="surface"
              />
              <Button disabled={saveDisabled} icon="save" loading={saving} onClick={handleSave} variant="brand">
                {t('save')}
              </Button>
            </div>
            {saveDisabled && <p className="pt-1 text-right type-caption text-muted-foreground">{t('nothingToSave')}</p>}
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
