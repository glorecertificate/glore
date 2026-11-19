import { useTranslations } from 'next-intl'

import { CourseRatingForm } from '@/components/features/courses/course-complete/rating-form'
import { skillGroupToneVariants } from '@/components/features/courses/skill-group'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import {
  type CompletionSkill,
  type CourseOverview,
  type CourseRecommendation,
  evaluateEligibility,
} from '@/db/queries/learning'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface CourseCompletionData {
  eligibility: ReturnType<typeof evaluateEligibility> | null
  myRating: { comment: string | null; rating: number } | null
  recommendation: CourseRecommendation | null
  skills: CompletionSkill[]
}

export const CourseNextSteps = ({
  completion,
  overview,
}: {
  completion: CourseCompletionData
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.complete')
  const { eligibility, recommendation } = completion

  return (
    <Card className="gap-4">
      <h2 className="type-heading">{t('nextTitle')}</h2>
      {eligibility?.eligible && (
        <Banner variant="success">
          <LucideIcon className="mt-0.5 size-4 shrink-0" name="award" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{t('certificateTitle')}</p>
              <p className="text-muted-foreground">{t('certificateText', { completed: eligibility.completed })}</p>
            </div>
            <Button asChild className="self-start">
              <Link href="/certificates/new">{t('certificateCta')}</Link>
            </Button>
          </div>
        </Banner>
      )}
      {eligibility && !eligibility.eligible && (
        <Banner variant="info">
          <LucideIcon className="mt-0.5 size-4 shrink-0" name="award" />
          <p className="text-muted-foreground">{t('certificateRemaining', { remaining: eligibility.remaining })}</p>
        </Banner>
      )}
      {recommendation && (
        <Link
          className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-surface-hover"
          href={`/courses/${recommendation.slug}`}
        >
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-full',
              skillGroupToneVariants({ tone: 'neutral' })
            )}
          >
            <LucideIcon className="size-5" name={(recommendation.icon ?? 'book-open') as IconName} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs text-muted-foreground">{t('recommendedTitle')}</span>
            <span className="truncate font-medium">{recommendation.title}</span>
          </span>
          <span className="text-sm text-brand-text">{t('recommendedCta')}</span>
        </Link>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/courses">{t('browse')}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/courses/${overview.slug}?lang=${overview.language}`}>{t('review')}</Link>
        </Button>
      </div>
    </Card>
  )
}

export const CourseCompleteView = ({
  className,
  completion,
  overview,
  ...props
}: React.ComponentProps<'div'> & { completion: CourseCompletionData; overview: CourseOverview }) => {
  const t = useTranslations('Learning.complete')
  const { skills } = completion

  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      <Card className="gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-stat-tile text-stat-foreground stat-accent-green">
            <LucideIcon className="size-6" name="trophy" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="type-heading">{t('summaryTitle')}</h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LucideIcon className="size-4 text-success-text" name="circle-check" />
              {t('lessonsDone', { count: overview.progress.completed })}
            </p>
          </div>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">{t('skillsTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('skillsHint')}</p>
            </div>
            <ul className="flex flex-col gap-3">
              {skills.map(({ description, title }) => (
                <li
                  className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface-muted p-3"
                  key={title}
                >
                  <span className="text-sm font-medium">{title}</span>
                  {description && <span className="text-sm text-muted-foreground">{description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <Card>
        <CourseRatingForm courseId={overview.id} initial={completion.myRating} />
      </Card>
      <CourseNextSteps completion={completion} overview={overview} />
    </div>
  )
}
