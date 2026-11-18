import { useTranslations } from 'next-intl'

import { CourseLanguageSwitch } from '@/components/features/courses/course-overview/language-switch'
import { CourseOutline } from '@/components/features/courses/course-overview/outline'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'
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
  const { enrollment, language, languages, outcomes, progress } = overview

  return (
    <div className={cn('grid gap-6 lg:grid-cols-3 lg:items-start', className)} {...props}>
      <aside className="flex flex-col gap-4 lg:col-start-3 lg:row-start-1">
        {enrollment && progress.total > 0 && (
          <Card className="gap-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('progressValue', { completed: progress.completed, total: progress.total })}</span>
              <span className="tabular-nums">{`${progress.percent}%`}</span>
            </div>
            <Progress
              aria-label={t('progressValue', { completed: progress.completed, total: progress.total })}
              color={progress.percent === 100 ? 'success' : 'brand'}
              value={progress.percent}
            />
          </Card>
        )}
        <CourseLanguageSwitch
          courseId={overview.id}
          language={language}
          languages={languages}
          persist={access === 'learner' && !!enrollment}
          slug={overview.slug}
        />
        {access === 'viewer' && (
          <Banner variant="warning">
            <LucideIcon className="mt-0.5 size-4 shrink-0" name="eye" />
            <p>{t('viewerNote')}</p>
          </Banner>
        )}
        <CourseCertificateNote completedSkills={access === 'learner' ? completedSkills : null} overview={overview} />
      </aside>
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:row-start-1">
        {outcomes.length > 0 && (
          <Card className="gap-3">
            <h2 className="type-heading">{t('outcomesTitle')}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {outcomes.map(outcome => (
                <li className="flex items-start gap-2 text-sm" key={outcome}>
                  <LucideIcon className="mt-0.5 size-4 shrink-0 text-success-text" name="circle-check" />
                  {outcome}
                </li>
              ))}
            </ul>
          </Card>
        )}
        <CourseOutline overview={overview} />
      </div>
    </div>
  )
}
