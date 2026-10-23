'use client'

import { useTranslations } from 'next-intl'

import { type AgeTone } from '@/components/features/certificates/rules'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TONE_CLASSES = {
  due: 'bg-warning/15 text-warning-text',
  fresh: 'bg-success/15 text-success-text',
  overdue: 'bg-destructive/15 text-destructive-text',
} as const satisfies Record<AgeTone, string>

export const AgeBadge = ({ className, days, tone }: { className?: string; days: number; tone: AgeTone }) => {
  const t = useTranslations('CertificateQueue')

  return (
    <Badge className={cn('gap-1', TONE_CLASSES[tone], className)} variant="ghost">
      {days === 0 ? t('ageToday') : t('ageDays', { days })}
    </Badge>
  )
}
