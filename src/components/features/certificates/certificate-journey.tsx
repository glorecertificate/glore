'use client'

import { useTranslations } from 'next-intl'

import { journeySteps } from '@/components/features/certificates/rules'
import { StepList } from '@/components/features/certificates/step-list'
import { type CertificateStatus } from '@/db/queries/certificate'

export const CertificateJourney = ({ status }: { status: CertificateStatus }) => {
  const t = useTranslations('CertificateDetail')

  return (
    <StepList
      aria-label={t('journey')}
      items={journeySteps(status).map(({ outcome, stage, state }) => ({
        key: stage,
        label: outcome ? t(`outcomes.${outcome}`) : t(`stages.${stage}`),
        state,
      }))}
    />
  )
}
