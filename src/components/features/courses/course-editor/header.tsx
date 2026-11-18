'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { CourseDialog } from '@/components/features/courses/course-dialog'
import { CourseAnalyticsSheet } from '@/components/features/courses/course-editor/analytics'
import { normalizeContent, useCourse } from '@/components/features/courses/course-editor/context'
import { CourseHeading } from '@/components/features/courses/course-editor/heading'
import { CourseLanguageTabs } from '@/components/features/courses/course-editor/language-tabs'
import { PublishControl } from '@/components/features/courses/course-editor/publish-control'
import { CourseTranslation } from '@/components/features/courses/course-editor/translation'
import { LucideIcon } from '@/components/icons/lucide'
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
import { Link } from '@/components/ui/link'
import { PageHeader, PageHeaderActions } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
      const missing = (error as { code?: string } | null)?.code === 'DESCRIPTIONS_MISSING'
      toast.error(missing ? tEditor('publishDescriptionsMissing') : t('saveError'))
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
      <PageHeader className="gap-4 lg:flex-row lg:items-start">
        <CourseHeading>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
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
            <span>{t('lessonsCount', { count: course.lessons.length })}</span>
          </div>
        </CourseHeading>
        <PageHeaderActions className="lg:justify-end">
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
                  <Button aria-label={tCourseCommon('settings')} size="icon" variant="outline">
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
              <Button asChild variant="outline">
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
                  <Button disabled icon="save" variant="brand">
                    {t('save')}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('nothingToSave')}</TooltipContent>
            </Tooltip>
          ) : (
            <Button icon="save" loading={saving} onClick={handleSave} variant="brand">
              {t('save')}
            </Button>
          )}
        </PageHeaderActions>
      </PageHeader>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CourseLanguageTabs />
        <CourseTranslation />
      </div>
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
