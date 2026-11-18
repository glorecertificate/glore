'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { completeLesson } from '@/actions/courses/progress'
import { CourseLanguageSwitch } from '@/components/features/courses/course-overview/language-switch'
import { LessonReader } from '@/components/features/courses/course-player/lesson-reader'
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
import { cn } from '@/lib/utils'

const PlayerLesson = ({
  access,
  lesson,
  overview,
}: {
  access: CourseAccess
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

  return (
    <Card className="min-w-0 gap-6 p-6 sm:p-8">
      <header className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm font-medium text-brand-text">
          {t('step', { current: index + 1, total: lessons.length })}
        </p>
        <h2 className="type-title text-balance">{lesson.title}</h2>
      </header>
      {!saves && (
        <Banner variant="warning">
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
      {lesson.content ? (
        <LessonReader content={lesson.content} version={`${lesson.id}-${language}`} />
      ) : (
        <p className="text-sm text-muted-foreground">{t('noContent')}</p>
      )}
      <LessonQuiz gated={!done} lesson={lesson} progress={progress} />
      <LessonSelfAssessment disabled={done} lesson={lesson} progress={progress} />
      <footer className="flex flex-col gap-3 border-t pt-6">
        {!done && hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        <div className={cn('flex items-center gap-3', previous ? 'justify-between' : 'justify-end')}>
          {previous && (
            <Button asChild variant="outline">
              <Link href={lessonHref(previous.id)}>{t('previous')}</Link>
            </Button>
          )}
          {done ? (
            <Button asChild>
              <Link href={next ? lessonHref(next.id) : finishHref}>
                {next ? t('next') : saves ? t('viewSummary') : t('backToOverview')}
              </Link>
            </Button>
          ) : isLast ? (
            <ConfettiButton
              disabled={!!progress.blocker || saving}
              effect="fireworks"
              loading={saving}
              onClick={onComplete}
            >
              {t('finish')}
            </ConfettiButton>
          ) : (
            <Button disabled={!!progress.blocker} loading={saving} onClick={onComplete}>
              {t('complete')}
            </Button>
          )}
        </div>
      </footer>
    </Card>
  )
}

export const CoursePlayer = ({
  access,
  className,
  lesson,
  overview,
  ...props
}: React.ComponentProps<'div'> & {
  access: CourseAccess
  lesson: LearnerLesson
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.player')
  const { language, languages, progress, slug } = overview

  useEffect(() => {
    void preloadMarkdown()
  }, [])

  return (
    <div className={cn('grid gap-8 md:grid-cols-[16rem_1fr]', className)} {...props}>
      <aside className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-card p-4 shadow-card md:sticky md:top-6 md:self-start">
        {access === 'learner' && (
          <div className="flex flex-col gap-1.5">
            <Progress color={progress.percent === 100 ? 'success' : 'brand'} value={progress.percent} />
            <span className="text-xs text-muted-foreground">
              {t('progress', { completed: progress.completed, total: progress.total })}
            </span>
          </div>
        )}
        <details className="group/lessons md:hidden">
          <summary className="relative flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-3 pointer-coarse:before:content-[''] [&::-webkit-details-marker]:hidden">
            <LucideIcon
              className="size-4 text-muted-foreground transition-transform group-open/lessons:rotate-90 motion-reduce:transition-none"
              name="chevron-right"
            />
            {t('lessons')}
          </summary>
          <PlayerOutline access={access} className="mt-2" currentId={lesson.id} overview={overview} />
        </details>
        <PlayerOutline access={access} className="hidden md:flex" currentId={lesson.id} overview={overview} />
        <CourseLanguageSwitch
          courseId={overview.id}
          language={language}
          languages={languages}
          lessonId={lesson.id}
          persist={access === 'learner'}
          slug={slug}
        />
      </aside>
      <PlayerLesson access={access} key={lesson.id} lesson={lesson} overview={overview} />
    </div>
  )
}
