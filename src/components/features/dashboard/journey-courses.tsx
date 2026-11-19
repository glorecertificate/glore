import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type EarnedSkill, type MemberCourseSummary } from '@/actions/dashboard/core'
import { CourseIcon } from '@/components/features/dashboard/course-icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

const ROW = 'flex items-center gap-3 border-t border-border-subtle py-3 first:border-t-0'

export const JourneyCourses = ({
  className,
  compass,
  completed,
  courses,
  exclude,
  min,
  showSkills,
  skills,
}: {
  className?: string
  compass: boolean
  completed: number
  courses: MemberCourseSummary['continuing']
  exclude?: string
  min: number
  showSkills: boolean
  skills: EarnedSkill[]
}) => {
  const t = useTranslations('Dashboard.journey')
  const tCommon = useTranslations('Common')
  const items = courses.filter(({ slug }) => slug !== exclude)
  const slots = Array.from({ length: Math.max(0, min - skills.length) }, (_, index) => `slot-${index}`)
  const showPath = compass || items.length > 0
  if (!showSkills && !showPath) return null

  return (
    <Card className={cn('gap-0 p-6 sm:px-7', className)} data-slot="journey-courses">
      {showSkills && (
        <section aria-labelledby="journey-skills-title">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h3 className="type-heading text-fg-title" id="journey-skills-title">
              {t('seals.heading')}
            </h3>
            <span className="type-label text-fg-2">{t('seals.count', { count: completed, min })}</span>
          </div>
          <ul aria-label={t('seals.label')}>
            {skills.map(skill => (
              <li className={ROW} key={skill.id}>
                <CourseIcon className="size-8" icon={skill.icon} type="skill" />
                <Link
                  className="min-w-0 flex-1 truncate rounded-sm text-sm font-medium text-fg-1 hover:text-fg-title focus-visible:focus-ring"
                  href={`/courses/${skill.slug}` as Route}
                >
                  {skill.title}
                </Link>
                <StatusBadge tone="success">{tCommon('completed')}</StatusBadge>
              </li>
            ))}
            {slots.map(slot => (
              <li className={ROW} key={slot}>
                <span
                  aria-hidden
                  className="size-8 shrink-0 rounded-lg border border-dashed border-border-strong bg-surface-muted"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-fg-2">{t('seals.missing')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {showPath && (
        <section
          aria-labelledby="journey-path-title"
          className={cn(showSkills && 'mt-6 border-t border-border-subtle pt-5')}
          data-slot="journey-path"
        >
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h3 className="type-heading text-fg-title" id="journey-path-title">
              {t('path.title')}
            </h3>
            {compass && (
              <Link
                className="rounded-sm type-label text-action-text underline-offset-4 hover:underline focus-visible:focus-ring"
                href="/courses"
              >
                {t('path.compass')}
              </Link>
            )}
          </div>
          {items.length > 0 && (
            <ul>
              {items.map(course => (
                <li className={ROW} key={course.slug}>
                  <CourseIcon className="size-8" icon={course.icon} type={course.type} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate text-sm font-medium text-fg-1">{course.title}</span>
                    <Progress
                      aria-label={t('path.percent', { percent: course.percent })}
                      className="h-1.5 max-w-90"
                      color="action"
                      value={course.percent}
                    />
                  </div>
                  <span className="type-caption text-fg-2 tabular-nums">
                    {t('path.percent', { percent: course.percent })}
                  </span>
                  <Button
                    aria-label={t('actions.continueCourse', { course: course.title })}
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/courses/${course.slug}` as Route}>{t('path.continue')}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Card>
  )
}
