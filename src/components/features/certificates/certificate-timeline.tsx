'use client'

import { useTranslations } from 'next-intl'

import { type CertificateActivityEvent } from '@/actions/certificates/queries'
import { useI18n } from '@/components/providers/i18n'
import { Timeline } from '@/components/ui/timeline'
import { TimelineItem } from '@/components/ui/timeline-item'
import { type Certificate } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'

const TIMELINE_ACTIONS = [
  'approved',
  'assigned',
  'changes_requested',
  'claimed',
  'rejected',
  'resubmitted',
  'revoked',
  'submitted',
  'unassigned',
  'withdrawn',
] as const

type TimelineAction = (typeof TIMELINE_ACTIONS)[number]

const timelineAction = (action: string) =>
  TIMELINE_ACTIONS.find(known => `certificate.${known}` === action) satisfies TimelineAction | undefined

export const CertificateTimeline = ({
  certificate,
  events,
}: {
  certificate: Certificate
  events: CertificateActivityEvent[]
}) => {
  const t = useTranslations('CertificateDetail')
  const { locale } = useI18n()
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Timeline aria-label={t('timeline')}>
      <TimelineItem
        dateTime={new Date(certificate.createdAt).toISOString()}
        time={formatter.format(new Date(certificate.createdAt))}
      >
        {t('events.created')}
      </TimelineItem>
      {events.flatMap(event => {
        const action = timelineAction(event.action)
        if (!action) return []
        const note = event.comment ?? event.reason
        return [
          <TimelineItem
            dateTime={new Date(event.createdAt).toISOString()}
            description={note ? <p className="whitespace-pre-wrap">{note}</p> : undefined}
            key={event.id}
            time={formatter.format(new Date(event.createdAt))}
          >
            {t(`events.${action}`, {
              actor: event.actor ? fullName(event.actor) : t('events.someone'),
              tutor: event.tutor ? fullName(event.tutor) : t('events.someone'),
            })}
          </TimelineItem>,
        ]
      })}
    </Timeline>
  )
}
