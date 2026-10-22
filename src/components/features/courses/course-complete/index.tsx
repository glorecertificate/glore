import { useTranslations } from 'next-intl'

import { CourseRatingForm } from '@/components/features/courses/course-complete/rating-form'
import { skillGroupToneVariants } from '@/components/features/courses/skill-group'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { LevelDots } from '@/components/ui/level-dots'
import { Link } from '@/components/ui/link'
import {
  type CompletionSkill,
  type CourseOverview,
  type CourseRecommendation,
  evaluateEligibility,
} from '@/db/queries/learning'
import { SKILL_LEVELS } from '@/lib/constants'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'

export interface CourseCompletionData {
  eligibility: ReturnType<typeof evaluateEligibility> | null
  myRating: { comment: string | null; rating: number } | null
  recommendation: CourseRecommendation | null
  skills: CompletionSkill[]
}

const NextSteps = ({ completion, overview }: { completion: CourseCompletionData; overview: CourseOverview }) => {
  const t = useTranslations('Learning.complete')
  const { eligibility, recommendation } = completion

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('nextTitle')}</h2>
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
          <p className="text-muted-foreground">
            {eligibility.lowRating
              ? t('certificateLowRating', { minRating: settings.minRating })
              : t('certificateRemaining', { remaining: eligibility.remaining })}
          </p>
        </Banner>
      )}
      {recommendation && (
        <Link
          className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
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
    </section>
  )
}

export const CourseCompleteView = ({
  className,
  completion,
  overview,
  ...props
}: React.ComponentProps<'div'> & { completion: CourseCompletionData; overview: CourseOverview }) => {
  const t = useTranslations('Learning.complete')
  const tCommon = useTranslations('Common')
  const { skills } = completion
  const levelLabel = (level: number) => tCommon(`skillLevels.${SKILL_LEVELS[level - 1] ?? 'absent'}`)

  return (
    <div className={cn('mx-auto flex w-full max-w-3xl flex-col gap-8 pt-2 pb-10', className)} {...props}>
      <section className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-2xs">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand/15 text-brand-text">
          <LucideIcon className="size-8" name="trophy" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-balance">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle', { course: overview.title })}</p>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('summaryTitle')}</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LucideIcon className="size-4 text-success" name="circle-check" />
          {t('lessonsDone', { count: overview.progress.completed })}
        </p>
        {skills.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">{t('skillsTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('skillsHint')}</p>
            </div>
            <ul className="flex flex-col gap-3">
              {skills.map(({ level, title }) => (
                <li
                  className="flex flex-col gap-1.5 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  key={title}
                >
                  <span className="text-sm font-medium">{title}</span>
                  <LevelDots label={levelLabel(level)} level={level} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <CourseRatingForm courseId={overview.id} initial={completion.myRating} />
      <NextSteps completion={completion} overview={overview} />
    </div>
  )
}
