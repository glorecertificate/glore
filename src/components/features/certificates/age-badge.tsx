'use client'

import { useTranslations } from 'next-intl'

import { type AgeTone } from '@/components/features/certificates/rules'
import { StatusBadge, type StatusMeta } from '@/components/ui/status-badge'

const AGE_TONES = {
  due: 'warning',
  fresh: 'neutral',
  overdue: 'danger',
} as const satisfies Record<AgeTone, StatusMeta['tone']>

export const AgeBadge = ({ className, days, tone }: { className?: string; days: number; tone: AgeTone }) => {
  const t = useTranslations('CertificateQueue')

  return (
    <StatusBadge className={className} icon={tone === 'overdue' ? 'alarm-clock' : 'clock'} tone={AGE_TONES[tone]}>
      {days === 0 ? t('ageToday') : t('ageDays', { days })}
    </StatusBadge>
  )
}
