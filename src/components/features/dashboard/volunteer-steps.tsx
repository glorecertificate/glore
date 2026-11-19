import { useFormatter, useTranslations } from 'next-intl'

import { type JourneyStage, type VolunteerSummary } from '@/actions/dashboard/core'
import { timestampMillis } from '@/db/queries/organization'
import { cn } from '@/lib/utils'

const SEGMENT_TONES = {
  current: 'bg-current-fill',
  done: 'bg-earned',
  ended: 'bg-danger',
  upcoming: 'bg-border',
}

const LABEL_TONES = {
  current: 'text-fg-title',
  done: 'text-fg-title',
  ended: 'text-fg-title',
  upcoming: 'text-fg-2',
}

export const VolunteerSteps = ({ volunteer }: { volunteer: VolunteerSummary }) => {
  const t = useTranslations('Dashboard.journey')
  const tVolunteer = useTranslations('Dashboard.volunteer')
  const { dateTime } = useFormatter()
  const { certificate, eligibility, journey, review } = volunteer
  const { phase } = journey

  const date = (value: string | null | undefined) =>
    value ? dateTime(new Date(timestampMillis(value)), { dateStyle: 'medium' }) : null

  const describe = ({ key, state }: JourneyStage) => {
    if (key === 'learn') {
      const count = eligibility.completedSkillCount
      return state === 'done'
        ? t('status.learned', { count })
        : t('status.learn', { count, min: eligibility.minSkills })
    }
    if (key === 'request') {
      if (state === 'upcoming') return tVolunteer('upcoming.request', { min: eligibility.minSkills })
      if (state === 'current') return t(`status.${phase as 'changes' | 'draft' | 'ready'}`)
      const sent = date(certificate?.submittedAt)
      return sent ? t('status.sent', { date: sent }) : null
    }
    if (key === 'review') {
      if (state === 'upcoming') return tVolunteer('upcoming.review')
      if (state === 'ended') return t(`status.${phase as 'rejected' | 'withdrawn'}`)
      if (state === 'current') return review?.tutor ? t('status.tutor', { name: review.tutor }) : t('status.waiting')
      const approved = date(certificate?.reviewedAt)
      return approved ? t('status.approved', { date: approved }) : null
    }
    if (state === 'upcoming') return tVolunteer('upcoming.certificate')
    if (state === 'ended') return t('status.revoked')
    const issued = date(certificate?.issuedAt ?? certificate?.reviewedAt)
    return issued ? t('status.issued', { date: issued }) : null
  }

  return (
    <ol aria-label={t('title')} className="grid gap-3 sm:grid-cols-4 sm:gap-4" data-slot="volunteer-steps">
      {journey.stages.map((stage, index) => (
        <li
          aria-current={stage.state === 'current' ? 'step' : undefined}
          className="flex min-w-0 gap-3 sm:flex-col sm:gap-2"
          key={stage.key}
        >
          <span
            aria-hidden
            className={cn(
              'w-1 shrink-0 self-stretch rounded-full sm:h-1 sm:w-full sm:self-auto',
              SEGMENT_TONES[stage.state]
            )}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={cn('text-sm font-semibold', LABEL_TONES[stage.state])}>
              {t('stepLabel', { index: index + 1, name: t(`stages.${stage.key}`) })}
            </span>
            <span className="type-caption text-fg-2">{describe(stage)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
