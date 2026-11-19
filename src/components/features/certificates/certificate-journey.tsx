'use client'

import { useTranslations } from 'next-intl'

import { formatActivityDate, journeyDates, journeySteps } from '@/components/features/certificates/rules'
import { StepList } from '@/components/features/certificates/step-list'
import { useI18n } from '@/components/providers/i18n'
import { type Certificate } from '@/db/queries/certificate'

export const CertificateJourney = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('CertificateDetail')
  const { locale } = useI18n()
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  const dates = journeyDates(certificate)

  return (
    <StepList
      aria-label={t('journey')}
      items={journeySteps(certificate.status).map(({ outcome, stage, state }) => {
        const date = dates[stage]
        return {
          caption: date && state !== 'upcoming' ? formatActivityDate(date.slice(0, 10), formatter) : null,
          key: stage,
          label: outcome ? t(`outcomes.${outcome}`) : t(`stages.${stage}`),
          state,
        }
      })}
    />
  )
}
