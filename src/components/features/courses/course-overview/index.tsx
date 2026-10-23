import { useTranslations } from 'next-intl'

import { CourseOverviewActions } from '@/components/features/courses/course-overview/action'
import { CourseDuration } from '@/components/features/courses/course-overview/duration'
import { CourseLanguageSwitch } from '@/components/features/courses/course-overview/language-switch'
import { CourseOutline } from '@/components/features/courses/course-overview/outline'
import { skillGroupTone, skillGroupToneVariants } from '@/components/features/courses/skill-group'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Progress } from '@/components/ui/progress'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'

const CourseCertificateNote = ({
  completedSkills,
  overview,
}: {
  completedSkills: number | null
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.overview')
  if (overview.type !== 'skill') return null

  return (
    <Banner variant="info">
      <LucideIcon className="mt-0.5 size-4 shrink-0 text-brand-text" name="award" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{t('certificateTitle')}</p>
        <p className="text-muted-foreground">
          {t('certificateNote', { minRating: settings.minRating, minSkills: settings.minSkills })}
        </p>
        {completedSkills !== null && (
          <p className="text-muted-foreground">
            {t('certificateProgress', {
              completed: Math.min(completedSkills, settings.minSkills),
              minSkills: settings.minSkills,
            })}
          </p>
        )}
      </div>
    </Banner>
  )
}

export const CourseOverviewView = ({
  access,
  className,
  completedSkills,
  overview,
  ...props
}: React.ComponentProps<'div'> & {
  access: CourseAccess
  completedSkills: number | null
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.overview')
  const { description, durationMinutes, enrollment, icon, language, languages, lessons, outcomes, progress, rating } =
    overview
  const tone = skillGroupTone(overview.skillGroup?.slug)

  return (
    <div className={cn('mx-auto flex w-full max-w-4xl flex-col gap-8 pt-2 pb-10', className)} {...props}>
      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-2xs sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'flex size-12 items-center justify-center rounded-full',
              skillGroupToneVariants({ surface: 'soft', tone })
            )}
          >
            <LucideIcon className="size-6" name={(icon ?? 'book-open') as IconName} />
          </span>
          <Badge variant="muted">{t(`type.${overview.type}`)}</Badge>
          {overview.skillGroup && (
            <Badge className={skillGroupToneVariants({ surface: 'soft', tone })}>{overview.skillGroup.name}</Badge>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-balance">{overview.title}</h1>
          {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {durationMinutes ? (
            <li className="flex items-center gap-1.5">
              <LucideIcon className="size-4" name="clock" />
              <CourseDuration minutes={durationMinutes} />
            </li>
          ) : null}
          <li className="flex items-center gap-1.5">
            <LucideIcon className="size-4" name="book-open" />
            {t('lessonsCount', { count: lessons.length })}
          </li>
          {rating.average !== null && (
            <li className="flex items-center gap-1.5">
              <LucideIcon className="size-4" name="star" />
              {t('rating', { count: rating.count, rating: rating.average })}
            </li>
          )}
        </ul>
        {enrollment && progress.total > 0 && (
          <div className="flex max-w-md flex-col gap-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('progressValue', { completed: progress.completed, total: progress.total })}</span>
              <span>{`${progress.percent}%`}</span>
            </div>
            <Progress color={progress.percent === 100 ? 'success' : 'brand'} value={progress.percent} />
          </div>
        )}
        <CourseOverviewActions access={access} overview={overview} />
        <CourseLanguageSwitch
          courseId={overview.id}
          language={language}
          languages={languages}
          persist={access === 'learner' && !!enrollment}
          slug={overview.slug}
        />
      </section>
      {access === 'viewer' && (
        <Banner variant="warning">
          <LucideIcon className="mt-0.5 size-4 shrink-0" name="eye" />
          <p>{t('viewerNote')}</p>
        </Banner>
      )}
      <CourseCertificateNote completedSkills={access === 'learner' ? completedSkills : null} overview={overview} />
      {outcomes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('outcomesTitle')}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {outcomes.map(outcome => (
              <li className="flex items-start gap-2 text-sm" key={outcome}>
                <LucideIcon className="mt-0.5 size-4 shrink-0 text-success-text" name="circle-check" />
                {outcome}
              </li>
            ))}
          </ul>
        </section>
      )}
      <CourseOutline overview={overview} />
    </div>
  )
}
