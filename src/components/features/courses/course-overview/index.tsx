import { useTranslations } from 'next-intl'

import { type CourseCompletionData } from '@/components/features/courses/course-complete'
import { CourseCompletedCard } from '@/components/features/courses/course-overview/completed'
import { CourseLanguageSwitch } from '@/components/features/courses/course-overview/language-switch'
import { CourseOutline } from '@/components/features/courses/course-overview/outline'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'

const CourseCertificateFact = ({
  completedSkills,
  overview,
}: {
  completedSkills: number | null
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.overview')
  if (overview.type !== 'skill') return null

  return (
    <div className="flex items-start gap-2.5 border-t border-border-subtle pt-4 text-sm">
      <LucideIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-text" name="award" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{t('certificateTitle')}</p>
        <p className="text-muted-foreground">{t('certificateNote', { minSkills: settings.minSkills })}</p>
        {completedSkills !== null && (
          <p className="text-muted-foreground">
            {t('certificateProgress', {
              completed: Math.min(completedSkills, settings.minSkills),
              minSkills: settings.minSkills,
            })}
          </p>
        )}
      </div>
    </div>
  )
}

export const CourseOverviewView = ({
  access,
  className,
  completedSkills,
  completion,
  overview,
  ...props
}: React.ComponentProps<'div'> & {
  access: CourseAccess
  completedSkills: number | null
  completion: CourseCompletionData | null
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.overview')
  const { enrollment, language, languages, lessons, outcomes, progress } = overview

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start', className)} {...props}>
      <aside className="flex flex-col gap-4 max-lg:order-last lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        <Card className="gap-4">
          {enrollment && progress.total > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {t('progressValue', { completed: progress.completed, total: progress.total })}
                </span>
                <span className="text-muted-foreground tabular-nums">{`${progress.percent}%`}</span>
              </div>
              <Progress
                aria-label={t('progressValue', { completed: progress.completed, total: progress.total })}
                color={progress.percent === 100 ? 'success' : 'default'}
                value={progress.percent}
              />
            </div>
          )}
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t('factLessons')}</dt>
              <dd className="font-medium">{lessons.length}</dd>
            </div>
            {languages.length > 1 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t('languageLabel')}</dt>
                <dd>
                  <CourseLanguageSwitch
                    courseId={overview.id}
                    language={language}
                    languages={languages}
                    persist={access === 'learner' && !!enrollment}
                    slug={overview.slug}
                  />
                </dd>
              </div>
            )}
          </dl>
          <CourseCertificateFact completedSkills={access === 'learner' ? completedSkills : null} overview={overview} />
        </Card>
        {access === 'viewer' && (
          <Banner variant="warning">
            <LucideIcon className="mt-0.5 size-4 shrink-0" name="eye" />
            <p>{t('viewerNote')}</p>
          </Banner>
        )}
      </aside>
      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
        {outcomes.length > 0 && (
          <Card className="gap-3">
            <h2 className="type-heading">{t('outcomesTitle')}</h2>
            <ul className="flex flex-col gap-2">
              {outcomes.map(outcome => (
                <li className="flex items-start gap-2 text-sm" key={outcome}>
                  <LucideIcon className="mt-0.5 size-4 shrink-0 text-success-text" name="circle-check" />
                  {outcome}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {completion && <CourseCompletedCard completion={completion} overview={overview} />}
        <CourseOutline access={access} overview={overview} />
      </div>
    </div>
  )
}
