import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const PlayerOutline = ({
  access,
  className,
  currentId,
  overview,
  ...props
}: React.ComponentProps<'ol'> & { access: CourseAccess; currentId: number; overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { language, lessons, slug } = overview
  const frontier = lessons.findIndex(lesson => lesson.status !== 'completed')

  return (
    <ol className={cn('flex flex-col gap-1', className)} {...props}>
      {lessons.map((lesson, index) => {
        const reachable = access !== 'learner' || frontier === -1 || index <= frontier
        const current = lesson.id === currentId
        const body = (
          <>
            <span
              aria-hidden
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                lesson.status === 'completed' && 'bg-success/10 text-success',
                lesson.status !== 'completed' && current && 'bg-primary text-primary-foreground',
                lesson.status !== 'completed' && !current && 'bg-muted text-muted-foreground'
              )}
            >
              {lesson.status === 'completed' ? <LucideIcon className="size-3.5" name="check" /> : index + 1}
            </span>
            <span className="min-w-0 grow truncate">{lesson.title}</span>
            <span className="sr-only">{t(`status.${lesson.status}`)}</span>
          </>
        )
        return (
          <li key={lesson.id}>
            {reachable ? (
              <Link
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60',
                  current && 'bg-accent font-medium'
                )}
                href={`/courses/${slug}/learn?lang=${language}&lesson=${lesson.id}`}
              >
                {body}
              </Link>
            ) : (
              <span className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-60">
                {body}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
