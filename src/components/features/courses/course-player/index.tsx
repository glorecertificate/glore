'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useId, useState } from 'react'

import { useTranslations } from 'next-intl'

import { completeLesson } from '@/actions/courses/progress'
import { CourseLanguageSwitch } from '@/components/features/courses/course-overview/language-switch'
import { PlayerOutline } from '@/components/features/courses/course-player/outline'
import { LessonQuiz } from '@/components/features/courses/course-player/quiz'
import { LessonSelfAssessment } from '@/components/features/courses/course-player/self-assessment'
import { useLessonProgress } from '@/components/features/courses/course-player/use-lesson-progress'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfettiButton } from '@/components/ui/confetti'
import { Link } from '@/components/ui/link'
import { preloadMarkdown } from '@/components/ui/markdown-lazy'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/toast'
import {
  type CourseAccess,
  type CourseOverview,
  type LearnerLesson,
  REFLECTION_MIN_LENGTH,
} from '@/db/queries/learning'
import { useScrollReset } from '@/hooks/use-scroll-reset'
import { cn } from '@/lib/utils'

const PlayerLesson = ({
  access,
  body,
  lesson,
  overview,
}: {
  access: CourseAccess
  body: React.ReactNode
  lesson: LearnerLesson
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.player')
  const { push } = useRouter()
  const { localeItems } = useI18n()
  const [saving, setSaving] = useState(false)
  const progress = useLessonProgress(lesson, overview.language)

  const { language, lessons, slug } = overview
  const index = lessons.findIndex(({ id }) => id === lesson.id)
  const previous = lessons[index - 1]
  const next = lessons[index + 1]
  const isLast = index === lessons.length - 1
  const saves = access === 'learner'
  const done = lesson.completed || !saves
  const lessonHref = (id: number) => `/courses/${slug}/learn?lang=${language}&lesson=${id}` as const
  const finishHref = saves
    ? (`/courses/${slug}/complete?lang=${language}` as const)
    : (`/courses/${slug}?lang=${language}` as const)

  const fallbackLabel = localeItems.find(({ value }) => value === lesson.contentLanguage)?.displayLabel

  const onComplete = () => {
    setSaving(true)
    startTransition(async () => {
      const result = await completeLesson({ ...progress.payload, language, lessonId: lesson.id })
      if ('error' in result) {
        toast.error(t('saveError'))
        setSaving(false)
        return
      }
      push(next ? lessonHref(next.id) : finishHref)
    })
  }

  const hints = {
    assessment: t('blocker.assessment'),
    descriptions: t('blocker.descriptions'),
    evaluations: t('blocker.evaluations'),
    quiz: t('blocker.quiz'),
    reflection: t('blocker.reflection', { min: REFLECTION_MIN_LENGTH }),
  }
  const hint = progress.blocker ? hints[progress.blocker] : null

  const primaryClass = 'min-w-0 flex-1 whitespace-nowrap sm:flex-none'

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card className="mx-auto w-full max-w-210 min-w-0 gap-6 p-5 sm:p-8">
        <header className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <h2 className="type-title text-balance sm:text-3xl">{lesson.title}</h2>
          <CourseLanguageSwitch
            className="shrink-0"
            courseId={overview.id}
            language={language}
            languages={overview.languages}
            lessonId={lesson.id}
            persist={saves}
            slug={slug}
          />
        </header>
        {!saves && (
          <Banner variant="info">
            <LucideIcon className="mt-0.5 size-4 shrink-0" name="eye" />
            <p>{t('previewNote')}</p>
          </Banner>
        )}
        {lesson.contentLanguage && lesson.contentLanguage !== language && (
          <Banner variant="info">
            <LucideIcon className="mt-0.5 size-4 shrink-0" name="languages" />
            <p>{t('fallbackLanguage', { language: fallbackLabel ?? lesson.contentLanguage })}</p>
          </Banner>
        )}
        {body ?? <p className="text-sm text-muted-foreground">{t('noContent')}</p>}
        <LessonQuiz gated={!done} lesson={lesson} progress={progress} />
        <LessonSelfAssessment disabled={done} lesson={lesson} progress={progress} />
      </Card>
      <div
        className="sticky bottom-0 z-10 mx-auto -mb-2 flex w-full max-w-210 flex-col gap-2 rounded-xl border border-border-subtle bg-surface-1/95 px-3 pt-3 pb-bar-safe shadow-card backdrop-blur sm:px-4"
        data-slot="lesson-bar"
      >
        {!done && hint && <p className="text-sm text-muted-foreground sm:hidden">{hint}</p>}
        <div className="flex items-center gap-3">
          {previous ? (
            <Button asChild className="shrink-0" variant="outline">
              <Link href={lessonHref(previous.id)}>
                <LucideIcon className="sm:hidden" name="arrow-left" />
                <span className="max-sm:sr-only">{t('previous')}</span>
              </Link>
            </Button>
          ) : null}
          <p className="hidden min-w-0 grow text-center text-sm text-muted-foreground sm:block">
            {!done && hint ? hint : t('step', { current: index + 1, total: lessons.length })}
          </p>
          {done ? (
            <Button asChild className={primaryClass}>
              <Link href={next ? lessonHref(next.id) : finishHref}>
                {next ? t('next') : saves ? t('viewSummary') : t('backToOverview')}
              </Link>
            </Button>
          ) : isLast ? (
            <ConfettiButton
              className={primaryClass}
              disabled={!!progress.blocker || saving}
              effect="fireworks"
              loading={saving}
              onClick={onComplete}
            >
              {t('finish')}
            </ConfettiButton>
          ) : (
            <Button className={primaryClass} disabled={!!progress.blocker} loading={saving} onClick={onComplete}>
              {t('complete')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export const CoursePlayer = ({
  access,
  body,
  className,
  lesson,
  overview,
  ...props
}: React.ComponentProps<'div'> & {
  access: CourseAccess
  body: React.ReactNode
  lesson: LearnerLesson
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.player')
  const { progress } = overview
  const progressLabelId = useId()

  useScrollReset(lesson.id)

  useEffect(() => {
    void preloadMarkdown()
  }, [])

  return (
    <div className={cn('grid gap-6 md:grid-cols-[17.5rem_minmax(0,1fr)] md:items-start', className)} {...props}>
      <aside className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-card p-4 shadow-card md:sticky md:top-6">
        {access === 'learner' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" id={progressLabelId}>
              {t('progress', { completed: progress.completed, total: progress.total })}
            </span>
            <Progress
              aria-labelledby={progressLabelId}
              color={progress.percent === 100 ? 'success' : 'default'}
              value={progress.percent}
            />
          </div>
        )}
        <details className="group/lessons md:hidden">
          <summary className="relative flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <LucideIcon
              className="size-4 text-muted-foreground transition-transform group-open/lessons:rotate-90 motion-reduce:transition-none"
              name="chevron-right"
            />
            {t('lessons')}
          </summary>
          <PlayerOutline access={access} className="mt-2" currentId={lesson.id} overview={overview} />
        </details>
        <PlayerOutline access={access} className="hidden md:flex" currentId={lesson.id} overview={overview} />
      </aside>
      <PlayerLesson access={access} body={body} key={lesson.id} lesson={lesson} overview={overview} />
    </div>
  )
}
