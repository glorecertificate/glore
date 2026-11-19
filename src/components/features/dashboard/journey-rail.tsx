import { useFormatter, useTranslations } from 'next-intl'

import { type JourneyStage, type VolunteerSummary } from '@/actions/dashboard/core'
import { JourneyMarker } from '@/components/features/dashboard/journey-marker'
import { JourneySteps } from '@/components/features/dashboard/journey-steps'
import { Card } from '@/components/ui/card'
import { timestampMillis } from '@/db/queries/organization'
import { cn } from '@/lib/utils'

const LABEL_TONES = {
  current: 'font-semibold text-fg-title',
  done: 'text-fg-1',
  ended: 'text-fg-1',
  upcoming: 'text-fg-2',
}

export const JourneyRail = ({ className, volunteer }: { className?: string; volunteer: VolunteerSummary }) => {
  const t = useTranslations('Dashboard.journey')
  const { dateTime } = useFormatter()
  const { certificate, eligibility, journey, review } = volunteer
  const { phase, steps } = journey
  const showSteps = (phase === 'draft' || phase === 'changes') && steps.length > 0

  const date = (value: string | null | undefined) =>
    value ? dateTime(new Date(timestampMillis(value)), { dateStyle: 'medium' }) : null

  const describe = ({ key, state }: JourneyStage) => {
    if (state === 'upcoming') return null
    if (key === 'learn') {
      const count = eligibility.completedSkillCount
      return state === 'done'
        ? t('status.learned', { count })
        : t('status.learn', { count, min: eligibility.minSkills })
    }
    if (key === 'request') {
      if (state === 'current') return t(`status.${phase as 'changes' | 'draft' | 'ready'}`)
      const sent = date(certificate?.submittedAt)
      return sent ? t('status.sent', { date: sent }) : null
    }
    if (key === 'review') {
      if (state === 'ended') return t(`status.${phase as 'rejected' | 'withdrawn'}`)
      if (state === 'current') return review?.tutor ? t('status.tutor', { name: review.tutor }) : t('status.waiting')
      const approved = date(certificate?.reviewedAt)
      return approved ? t('status.approved', { date: approved }) : null
    }
    if (state === 'ended') return t('status.revoked')
    const issued = date(certificate?.issuedAt ?? certificate?.reviewedAt)
    return issued ? t('status.issued', { date: issued }) : null
  }

  return (
    <Card className={cn('gap-5 p-6', className)} data-slot="journey-rail">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-heading text-fg-title" id="journey-rail-title">
          {t('title')}
        </h2>
        <p className="type-caption text-fg-2">
          {t('position', { current: journey.current + 1, total: journey.stages.length })}
        </p>
      </div>
      <ol className="flex flex-col">
        {journey.stages.map((stage, index) => {
          const line = describe(stage)
          return (
            <li
              aria-current={stage.state === 'current' ? 'step' : undefined}
              className="relative flex gap-3 pb-6 last:pb-0"
              key={stage.key}
            >
              {index < journey.stages.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-7 bottom-1 left-2.75 w-0.5 overflow-hidden rounded-full bg-border"
                >
                  <span
                    className={cn(
                      'block size-full origin-top bg-earned transition-transform duration-240 ease-out motion-reduce:transition-none',
                      stage.state === 'done' ? 'scale-y-100' : 'scale-y-0'
                    )}
                  />
                </span>
              )}
              <JourneyMarker state={stage.state} tone={phase === 'withdrawn' ? 'neutral' : 'danger'} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <span className={cn('type-label', LABEL_TONES[stage.state])}>{t(`stages.${stage.key}`)}</span>
                {line && <span className="type-caption text-fg-2">{line}</span>}
                {showSteps && stage.key === 'request' && <JourneySteps className="mt-2.5" steps={steps} />}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
