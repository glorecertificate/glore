import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type CourseOverview } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const CourseOutline = ({
  className,
  overview,
  ...props
}: React.ComponentProps<'section'> & { overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { lessons } = overview

  return (
    <section className={cn('flex flex-col gap-3', className)} {...props}>
      <h2 className="text-lg font-semibold">{t('outlineTitle')}</h2>
      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noLessons')}</p>
      ) : (
        <ol className="flex flex-col divide-y rounded-xl border bg-card">
          {lessons.map((lesson, index) => (
            <li className="flex items-center gap-3 px-4 py-3" key={lesson.id}>
              <span
                aria-hidden
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  lesson.status === 'completed' && 'bg-success/10 text-success',
                  lesson.status === 'current' && 'bg-primary text-primary-foreground',
                  lesson.status === 'upcoming' && 'bg-muted text-muted-foreground'
                )}
              >
                {lesson.status === 'completed' ? <LucideIcon className="size-4" name="check" /> : index + 1}
              </span>
              <div className="flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{lesson.title}</span>
                <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{t(`status.${lesson.status}`)}</span>
                  {lesson.hasQuiz && <span>{t('activity.quiz')}</span>}
                  {lesson.hasEvaluations && <span>{t('activity.selfAssessment')}</span>}
                  {lesson.hasAssessment && <span>{t('activity.finalAssessment')}</span>}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
