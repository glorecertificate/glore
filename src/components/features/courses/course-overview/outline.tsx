import { useTranslations } from 'next-intl'

import { StartCourseDialog } from '@/components/features/courses/course-overview/start-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

const STATUS_TONES = { completed: 'success', current: 'info', upcoming: 'neutral' } as const

export const CourseOutline = ({
  access,
  className,
  overview,
  ...props
}: React.ComponentProps<'section'> & { access: CourseAccess; overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const tPlayer = useTranslations('Learning.player')
  const { id, language, lessons, slug, title } = overview
  const showStatus = access === 'learner' && !!overview.enrollment
  const startsCourse = access === 'learner' && !overview.enrollment
  const frontier = lessons.findIndex(lesson => lesson.status !== 'completed')

  return (
    <section className={cn('flex flex-col gap-3', className)} {...props}>
      <h2 className="type-heading">{t('outlineTitle')}</h2>
      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noLessons')}</p>
      ) : (
        <ol className="flex flex-col divide-y overflow-hidden rounded-xl border border-border-subtle bg-card shadow-card">
          {lessons.map((lesson, index) => {
            const status = showStatus ? lesson.status : 'upcoming'
            const activities = [
              lesson.hasQuiz && t('activity.quiz'),
              lesson.hasEvaluations && t('activity.selfAssessment'),
              lesson.hasAssessment && t('activity.finalAssessment'),
            ].filter(Boolean)
            const locked = access === 'learner' && frontier !== -1 && index > frontier
            const row = 'flex min-h-14 items-center gap-3 px-4 py-3'
            const body = (
              <>
                <span
                  aria-hidden
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    status === 'completed' && 'bg-success-subtle text-success-text',
                    status === 'current' && 'border-2 border-chart-teal text-fg-title',
                    status === 'upcoming' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {status === 'completed' ? <LucideIcon className="size-4" name="check" /> : index + 1}
                </span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{lesson.title}</span>
                  {activities.length > 0 && (
                    <span className="truncate text-xs text-muted-foreground">{activities.join(', ')}</span>
                  )}
                </span>
                {locked && <LucideIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" name="lock" />}
                {locked && <span className="sr-only">{tPlayer('locked')}</span>}
                {showStatus && !locked && (
                  <StatusBadge className="shrink-0" tone={STATUS_TONES[status]}>
                    {t(`status.${status}`)}
                  </StatusBadge>
                )}
              </>
            )
            if (startsCourse && !locked) {
              return (
                <li key={lesson.id}>
                  <StartCourseDialog
                    courseId={id}
                    language={language}
                    lessonCount={lessons.length}
                    lessonId={lesson.id}
                    title={title}
                  >
                    <button
                      className={cn(
                        row,
                        'w-full cursor-pointer text-left transition-colors hover:bg-surface-hover focus-visible:focus-ring-inset'
                      )}
                      type="button"
                    >
                      {body}
                    </button>
                  </StartCourseDialog>
                </li>
              )
            }
            return (
              <li key={lesson.id}>
                {locked ? (
                  <div className={cn(row, 'text-muted-foreground')}>{body}</div>
                ) : (
                  <Link
                    className={cn(row, 'transition-colors hover:bg-surface-hover')}
                    href={`/courses/${slug}/learn?lang=${language}&lesson=${lesson.id}`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
