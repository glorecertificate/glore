'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { startCourse } from '@/actions/courses/progress'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const CourseOverviewActions = ({
  access,
  className,
  overview,
  ...props
}: React.ComponentProps<'div'> & { access: CourseAccess; overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { push } = useRouter()
  const [starting, setStarting] = useState(false)

  const { enrollment, id, language, lessons, progress, resumeLessonId, slug } = overview
  const completed = !!enrollment?.completedAt || (progress.total > 0 && progress.completed === progress.total)
  const learnHref = (lessonId: number | null) =>
    `/courses/${slug}/learn?lang=${language}&lesson=${lessonId ?? ''}` as const

  const onStart = async () => {
    setStarting(true)
    const result = await startCourse(id, language)
    if ('error' in result) {
      toast.error(t('startError'))
      setStarting(false)
      return
    }
    push(learnHref(lessons[0]?.id ?? null))
  }

  if (lessons.length === 0) return null

  if (access === 'viewer') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)} {...props}>
        <Button asChild size="lg">
          <Link href={learnHref(lessons[0]?.id ?? null)}>{t('preview')}</Link>
        </Button>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)} {...props}>
        <Button loading={starting} onClick={onStart} size="lg">
          {t('start')}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} {...props}>
      <Button asChild size="lg">
        <Link href={learnHref(completed ? (lessons[0]?.id ?? null) : resumeLessonId)}>
          {completed ? t('review') : t('resume')}
        </Link>
      </Button>
      {completed && (
        <Button asChild size="lg" variant="outline">
          <Link href={`/courses/${slug}/complete?lang=${language}`}>{t('viewCompletion')}</Link>
        </Button>
      )}
    </div>
  )
}
