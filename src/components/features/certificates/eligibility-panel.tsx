'use client'

import { useTranslations } from 'next-intl'

import { type CertificateEligibility } from '@/actions/certificates/queries'
import { LucideIcon } from '@/components/icons/lucide'
import { ArrowsMotif } from '@/components/ui/arrows-motif'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import appConfig from '~/config/app.json'

interface Requirement {
  detail: string
  key: string
  met: boolean | null
  progress?: number
  title: string
}

export const EligibilityPanel = ({
  className,
  eligibility,
  openRequestId,
  ...props
}: Omit<React.ComponentProps<'section'>, 'children'> & {
  eligibility: CertificateEligibility
  openRequestId?: number | null
}) => {
  const t = useTranslations('CertificateEligibility')
  const { avgRating, completedSkillCount, hasLowRatings, minRating, minSkills } = eligibility

  const requirements: Requirement[] = [
    {
      detail: t('coursesDetail', { count: Math.min(completedSkillCount, minSkills), min: minSkills }),
      key: 'courses',
      met: completedSkillCount >= minSkills,
      progress: Math.min(100, (completedSkillCount / minSkills) * 100),
      title: t('courses', { min: minSkills }),
    },
    {
      detail:
        avgRating === null ? t('ratingNone') : t('ratingDetail', { average: avgRating.toFixed(1), min: minRating }),
      key: 'rating',
      met: avgRating !== null && !hasLowRatings,
      title: t('rating', { min: minRating }),
    },
    {
      detail: t('activityDetail'),
      key: 'activity',
      met: null,
      title: t('activity', { hours: appConfig.minActivityHours, months: appConfig.minActivityMonths }),
    },
  ]

  return (
    <section
      aria-labelledby="eligibility-title"
      className={cn(
        'relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border bg-card p-6 sm:p-8',
        className
      )}
      data-slot="eligibility-panel"
      {...props}
    >
      <ArrowsMotif className="absolute -right-10 -bottom-10 w-72" />
      <div className="relative flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold" id="eligibility-title">
            {openRequestId ? t('openTitle') : t('title')}
          </h2>
          <p className="text-sm text-muted-foreground">{openRequestId ? t('openDescription') : t('description')}</p>
        </div>
        {!openRequestId && (
          <ul className="flex flex-col gap-4">
            {requirements.map(requirement => (
              <li className="flex gap-3" key={requirement.key}>
                {requirement.met === null ? (
                  <LucideIcon name="info" className="mt-0.5 size-5 shrink-0 text-brand-text" />
                ) : requirement.met ? (
                  <LucideIcon name="circle-check" className="mt-0.5 size-5 shrink-0 text-success-text" />
                ) : (
                  <LucideIcon name="circle-dashed" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-medium">{requirement.title}</p>
                  <p className="text-sm text-muted-foreground">{requirement.detail}</p>
                  {requirement.progress !== undefined && (
                    <Progress aria-label={requirement.title} className="max-w-xs" value={requirement.progress} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          {openRequestId ? (
            <Button asChild>
              <Link href={`/certificates/${openRequestId}`}>{t('viewRequest')}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/courses">{t('goToCourses')}</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/certificates">{t('backToCertificates')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
