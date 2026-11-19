import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type MemberCourseSummary } from '@/actions/dashboard/core'
import { CourseIcon } from '@/components/features/dashboard/course-icon'
import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'

const ROW =
  'flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover focus-visible:focus-ring'

export const JourneyPath = ({
  className,
  compass,
  courses,
  exclude,
}: {
  className?: string
  compass: boolean
  courses: MemberCourseSummary['continuing']
  exclude?: string
}) => {
  const t = useTranslations('Dashboard.journey')
  const items = courses.filter(({ slug }) => slug !== exclude)
  if (!compass && items.length === 0) return null

  return (
    <section
      aria-labelledby="journey-path-title"
      className={cn('flex flex-col gap-2 border-t border-border-subtle pt-5', className)}
      data-slot="journey-path"
    >
      <h3 className="type-label text-fg-2" id="journey-path-title">
        {t('path.title')}
      </h3>
      <ul className="-mx-2 flex flex-col">
        {compass && (
          <li>
            <Link className={ROW} href="/courses">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-action-subtle text-action-text"
              >
                <LucideIcon className="size-4" name="compass" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-fg-1">{t('path.compass')}</span>
            </Link>
          </li>
        )}
        {items.map(course => (
          <li key={course.slug}>
            <Link className={ROW} href={`/courses/${course.slug}` as Route}>
              <CourseIcon className="size-7" icon={course.icon} type={course.type} />
              <span className="min-w-0 flex-1 truncate text-sm text-fg-1">{course.title}</span>
              <span className="type-caption text-fg-2 tabular-nums">
                {t('path.percent', { percent: course.percent })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
